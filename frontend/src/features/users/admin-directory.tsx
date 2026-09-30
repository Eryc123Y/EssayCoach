'use client';

import { localized } from '@/locales';

import { usePreferences } from '@/components/layout/preference-provider';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { IconSearch, IconUserPlus } from '@tabler/icons-react';
import { adminUsersService, type AccountActivity, type DirectoryDetail, type DirectoryUser } from '@/service/api/v2/admin-users';
import { classService } from '@/service/api/v2/classes';
import { invitationLink, invitationService } from '@/service/api/v2/invitations';
import type { ClassItem } from '@/service/api/v2/types';

export function AdminDirectory() {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [users, setUsers] = useState<DirectoryUser[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const listGeneration = useRef(0);
  const [sortKey, setSortKey] = useState<'name' | 'role' | 'status' | 'joined'>('joined');
  const [sortAscending, setSortAscending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<DirectoryDetail | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [activity, setActivity] = useState<AccountActivity[]>([]);
  const [checked, setChecked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'student' | 'lecturer'>('lecturer');
  const [inviteClassId, setInviteClassId] = useState('');
  const [inviteUnitId, setInviteUnitId] = useState('');
  const [issuedLink, setIssuedLink] = useState('');
  const [resetLink, setResetLink] = useState('');
  const t = (en: string, zh?: string) => localized(language, en, zh);
  const roleLabel = (value: string) => ({ student: t('ui.student'), lecturer: t('ui.lecturer'), admin: t('ui.admin') } as Record<string, string>)[value] || value;
  const statusLabel = (value: string) => ({ active: t('ui.active'), suspended: t('ui.suspended'), unregistered: t('ui.notActivated') } as Record<string, string>)[value] || value;
  const relationshipLabel = (value: string) => ({ student: t('ui.student'), teacher: t('ui.teacher'), course_lead: t('ui.courseLead') } as Record<string, string>)[value] || value;
  const sortedUsers = useMemo(() => [...users].sort((a, b) => {
    const value = (user: DirectoryUser) => sortKey === 'name'
      ? ([user.user_fname, user.user_lname].filter(Boolean).join(' ') || user.user_email).toLocaleLowerCase()
      : sortKey === 'role' ? user.user_role
      : sortKey === 'status' ? user.user_status : user.date_joined;
    return (sortAscending ? 1 : -1) * value(a).localeCompare(value(b));
  }), [users, sortKey, sortAscending]);
  const sortBy = (key: typeof sortKey) => {
    setSortAscending(current => sortKey === key ? !current : true);
    setSortKey(key);
  };

  function refreshList() {
    const generation = ++listGeneration.current;
    setLoading(true);
    adminUsersService.list({ search: deferredSearch, role: role || undefined, status: status || undefined, page: 1 })
      .then((rows) => { if (generation === listGeneration.current) { setUsers(rows); setPage(1); setHasMore(rows.length === 100); setError(''); } })
      .catch((cause) => { if (generation === listGeneration.current) setError(cause instanceof Error ? cause.message : 'Could not load users.'); })
      .finally(() => { if (generation === listGeneration.current) setLoading(false); });
  }

  async function loadMoreUsers() {
    if (loadingMore || !hasMore) return;
    const generation = listGeneration.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    try {
      const rows = await adminUsersService.list({ search: deferredSearch, role: role || undefined, status: status || undefined, page: nextPage });
      if (generation === listGeneration.current) {
        setUsers(current => [...current, ...rows]);
        setPage(nextPage);
        setHasMore(rows.length === 100);
      }
    } catch (cause) {
      if (generation === listGeneration.current) setError(cause instanceof Error ? cause.message : t('ui.couldNotLoadMorePeople'));
    } finally { setLoadingMore(false); }
  }

  useEffect(() => { refreshList(); }, [deferredSearch, role, status]);
  useEffect(() => {
    if (selectedId === null) { setSelected(null); setActivity([]); return; }
    setResetLink('');
    Promise.all([adminUsersService.detail(selectedId), adminUsersService.activity(selectedId)])
      .then(([detail, events]) => {
        setSelected(detail); setActivity(events);
        setEditFirstName(detail.user_fname || ''); setEditLastName(detail.user_lname || '');
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load this account.'));
  }, [selectedId]);
  useEffect(() => {
    if (showInvite) classService.listClasses().then(setClasses).catch(() => setError('Could not load classes.'));
  }, [showInvite]);

  async function applyAction(action: 'disable_user' | 'enable_user' | 'force_logout', ids: number[]) {
    if (!ids.length || !window.confirm(localized(language, 'ui.applyAccountActionConfirm', { action: action.replace('_', ' '), count: ids.length }))) return;
    setBusy(true);
    const results = await Promise.allSettled(ids.map((id) => adminUsersService.action(id, action)));
    const failures = results.filter((result) => result.status === 'rejected').length;
    setError(failures ? localized(language, 'ui.accountsCouldNotBeUpdated', { count: failures }) : '');
    setChecked([]);
    refreshList();
    if (selectedId !== null) {
      adminUsersService.detail(selectedId).then(setSelected).catch(() => setSelected(null));
      adminUsersService.activity(selectedId).then(setActivity).catch(() => setActivity([]));
    }
    setBusy(false);
  }

  async function issueInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const invitation = await invitationService.create({
        email: inviteEmail.trim(), role: inviteRole,
        ...(inviteRole === 'student' ? { class_id: Number(inviteClassId) } : inviteUnitId ? { lead_unit_id: inviteUnitId } : {}),
      });
      setIssuedLink(invitationLink(invitation.token));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not issue invitation.');
    } finally {
      setBusy(false);
    }
  }

  async function issueResetLink(user: DirectoryDetail) {
    if (!window.confirm(localized(language, 'ui.issueOneTimeResetFor', { email: user.user_email }))) return;
    setBusy(true);
    try {
      const grant = await adminUsersService.issuePasswordReset(user.user_id);
      setResetLink(`${window.location.origin}/auth/forgot-password#token=${encodeURIComponent(grant.token)}`);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not issue a password reset.');
    } finally {
      setBusy(false);
    }
  }

  async function saveName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !(editFirstName.trim() || editLastName.trim())) return;
    setBusy(true);
    try {
      await adminUsersService.updateName(selected.user_id, editFirstName.trim(), editLastName.trim());
      setSelected(await adminUsersService.detail(selected.user_id));
      setActivity(await adminUsersService.activity(selected.user_id));
      refreshList();
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.couldNotSaveTheName'));
    } finally {
      setBusy(false);
    }
  }

  const leadUnits = [...new Set(classes.map((item) => item.unit_id_unit))];
  return <main className='mx-auto max-w-7xl px-5 py-9 md:px-9 md:py-14'>
    <div className='flex flex-wrap items-start justify-between gap-5'><div><p className='text-xs font-bold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / ADMIN</p><h1 className='mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50'>{t('ui.peopleAccess')}</h1><p className='mt-3 text-slate-600 dark:text-slate-300'>{t('ui.invitePeopleCheckClassMembershipAndManageAccountAccess')}</p></div><div className='flex gap-2'><button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800'>{language === 'en' ? '中文' : 'English'}</button><button type='button' onClick={() => { setShowInvite(true); setIssuedLink(''); }} className='inline-flex items-center gap-2 rounded-full bg-teal-300 px-5 py-2 text-sm font-bold text-slate-950'><IconUserPlus size={17} />{t('ui.invitePerson')}</button></div></div>

    {error && <p role='alert' className='mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-800'>{error}</p>}
    <section className='mt-9 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-7'>
      <div className='grid gap-3 md:grid-cols-[1fr_180px_180px]'><label className='flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3'><IconSearch size={18} className='text-slate-500' /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label={t('ui.searchUsers')} placeholder={t('ui.nameOrEmail')} className='w-full bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500' /></label><select aria-label={t('ui.roleFilter')} value={role} onChange={(event) => setRole(event.target.value)} className='rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900'><option value=''>{t('ui.allRoles')}</option><option value='student'>{t('ui.students6d0190')}</option><option value='lecturer'>{t('ui.lecturerse0040e')}</option><option value='admin'>{t('ui.admins')}</option></select><select aria-label={t('ui.statusFilter')} value={status} onChange={(event) => setStatus(event.target.value)} className='rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900'><option value=''>{t('ui.allStatuses')}</option><option value='active'>{t('ui.active')}</option><option value='suspended'>{t('ui.suspended')}</option><option value='unregistered'>{t('ui.notActivated')}</option></select></div>
      {checked.length > 0 && <div className='mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-teal-50 p-3 text-sm text-teal-950'><span className='mr-auto'>{checked.length} {t('ui.selected')}</span><button disabled={busy} onClick={() => applyAction('disable_user', checked)} className='rounded-full border border-teal-700 px-3 py-1.5 font-semibold'>{t('ui.suspend')}</button><button disabled={busy} onClick={() => applyAction('enable_user', checked)} className='rounded-full border border-teal-700 px-3 py-1.5 font-semibold'>{t('ui.restore')}</button></div>}
      <label className='mt-5 flex items-center gap-2 text-sm font-semibold text-slate-600 md:hidden'>{t('ui.sortBy')}<select aria-label={t('ui.sortPeople')} value={`${sortKey}:${sortAscending ? 'asc' : 'desc'}`} onChange={(event) => { const [key, direction] = event.target.value.split(':'); setSortKey(key as typeof sortKey); setSortAscending(direction === 'asc'); }} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900'><option value='joined:desc'>{t('ui.newestFirst')}</option><option value='name:asc'>{t('ui.nameAToZ')}</option><option value='name:desc'>{t('ui.nameZToA')}</option><option value='role:asc'>{t('ui.role')}</option><option value='status:asc'>{t('ui.status')}</option></select></label>
      <div className='mt-5 space-y-3 md:hidden'>{sortedUsers.map((user) => <article key={user.user_id} className='rounded-2xl border border-slate-200 p-4'><div className='flex items-start gap-3'><input type='checkbox' aria-label={`${t('ui.select')} ${user.user_email}`} checked={checked.includes(user.user_id)} disabled={user.user_role === 'admin'} onChange={(event) => setChecked((current) => event.target.checked ? [...current, user.user_id] : current.filter((id) => id !== user.user_id))} className='mt-1' /><div className='min-w-0 flex-1'><strong className='block text-sm text-slate-900'>{[user.user_fname, user.user_lname].filter(Boolean).join(' ') || user.user_email}</strong><p className='break-all text-xs text-slate-500'>{user.user_email}</p><p className='mt-2 text-xs text-slate-600'>{roleLabel(user.user_role)} · {statusLabel(user.user_status)}</p></div><button type='button' onClick={() => setSelectedId(user.user_id)} className='text-sm font-semibold text-teal-800'>{t('ui.view')}</button></div></article>)}</div>
      <div className='mt-5 hidden overflow-x-auto md:block'><table className='w-full min-w-[680px] text-left text-sm'><thead className='border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500'><tr><th className='py-3 pr-3'><span className='sr-only'>{t('ui.select')}</span></th><th className='py-3' aria-sort={sortKey === 'name' ? sortAscending ? 'ascending' : 'descending' : 'none'}><button type='button' onClick={() => sortBy('name')} className='font-semibold hover:text-teal-800'>{t('ui.nameEmail')} {sortKey === 'name' ? sortAscending ? '↑' : '↓' : ''}</button></th><th aria-sort={sortKey === 'role' ? sortAscending ? 'ascending' : 'descending' : 'none'}><button type='button' onClick={() => sortBy('role')} className='font-semibold hover:text-teal-800'>{t('ui.role')} {sortKey === 'role' ? sortAscending ? '↑' : '↓' : ''}</button></th><th aria-sort={sortKey === 'status' ? sortAscending ? 'ascending' : 'descending' : 'none'}><button type='button' onClick={() => sortBy('status')} className='font-semibold hover:text-teal-800'>{t('ui.status')} {sortKey === 'status' ? sortAscending ? '↑' : '↓' : ''}</button></th><th aria-sort={sortKey === 'joined' ? sortAscending ? 'ascending' : 'descending' : 'none'}><button type='button' onClick={() => sortBy('joined')} className='font-semibold hover:text-teal-800'>{t('ui.joined766e6b')} {sortKey === 'joined' ? sortAscending ? '↑' : '↓' : ''}</button></th><th><span className='sr-only'>{t('ui.open90f98c')}</span></th></tr></thead><tbody>{sortedUsers.map((user) => <tr key={user.user_id} className='border-b border-slate-100 text-slate-800'><td className='py-4 pr-3'><input type='checkbox' aria-label={`${t('ui.select')} ${user.user_email}`} checked={checked.includes(user.user_id)} disabled={user.user_role === 'admin'} onChange={(event) => setChecked((current) => event.target.checked ? [...current, user.user_id] : current.filter((id) => id !== user.user_id))} /></td><td className='py-4'><strong className='block font-semibold'>{[user.user_fname, user.user_lname].filter(Boolean).join(' ') || '—'}</strong><span className='text-slate-500'>{user.user_email}</span></td><td>{roleLabel(user.user_role)}</td><td><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.user_status === 'active' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>{statusLabel(user.user_status)}</span></td><td>{new Date(user.date_joined).toLocaleDateString()}</td><td><button type='button' onClick={() => setSelectedId(user.user_id)} className='font-semibold text-teal-800 hover:underline'>{t('ui.view')}</button></td></tr>)}</tbody></table></div>{loading && <p className='py-8 text-center text-sm text-slate-500'>{t('ui.loadingPeople')}</p>}{!loading && !users.length && <p className='py-8 text-center text-sm text-slate-500'>{t('ui.noPeopleMatchTheseFilters')}</p>}
      {hasMore && <div className='mt-5 text-center'><button type='button' disabled={loadingMore || loading} onClick={() => void loadMoreUsers()} className='rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-teal-800 disabled:opacity-50'>{loadingMore ? t('ui.loadingMore') : t('ui.loadMorePeople')}</button></div>}
    </section>

    {selected && <section className='mt-7 rounded-[2rem] border border-slate-200 bg-white p-6 md:p-8'><div className='flex flex-wrap items-start justify-between gap-4'><div><p className='text-xs font-bold uppercase tracking-widest text-teal-700'>{t('ui.accountDetail')}</p><h2 className='mt-2 break-all text-2xl font-semibold text-slate-950'>{selected.user_email}</h2><p className='mt-1 text-sm text-slate-500'>{roleLabel(selected.user_role)} · {statusLabel(selected.user_status)} · {selected.submissions_count} {t('ui.submissions')}</p></div><button onClick={() => setSelectedId(null)} className='text-sm font-semibold text-slate-600'>{t('ui.close')}</button></div><form onSubmit={saveName} className='mt-6 flex flex-wrap items-end gap-3 rounded-xl bg-slate-50 p-4'><label className='text-sm font-semibold text-slate-700'>{t('ui.firstName')}<input maxLength={20} value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} className='mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900' /></label><label className='text-sm font-semibold text-slate-700'>{t('ui.lastName')}<input maxLength={20} value={editLastName} onChange={(event) => setEditLastName(event.target.value)} className='mt-1 block rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900' /></label><button type='submit' disabled={busy || !(editFirstName.trim() || editLastName.trim())} className='rounded-full bg-teal-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>{busy ? t('ui.saving83ad29') : t('ui.saveName')}</button></form><div className='mt-6 grid gap-6 md:grid-cols-2'><div><h3 className='font-semibold text-slate-900'>{t('ui.classes47c68f')}</h3><div className='mt-3 space-y-2'>{selected.classes.length ? selected.classes.map((item) => <p key={`${item.relationship}-${item.class_id}`} className='rounded-xl bg-slate-50 p-3 text-sm text-slate-700'>{item.unit_id} · {item.class_name} · {relationshipLabel(item.relationship)}</p>) : <p className='text-sm text-slate-500'>{t('ui.noClassesAssigned9ffc5d')}</p>}</div></div><div><h3 className='font-semibold text-slate-900'>{t('ui.accessHistory')}</h3><div className='mt-3 space-y-2'>{activity.length ? activity.map((item) => <p key={item.id} className='rounded-xl bg-slate-50 p-3 text-sm text-slate-700'>{item.action.replaceAll('_', ' ')} · {new Date(item.created_at).toLocaleString()}</p>) : <p className='text-sm text-slate-500'>{t('ui.noChangesRecorded')}</p>}</div></div></div>{selected.user_role !== 'admin' && <div className='mt-6 flex flex-wrap gap-2'><button disabled={busy} onClick={() => applyAction(selected.user_status === 'active' ? 'disable_user' : 'enable_user', [selected.user_id])} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800'>{selected.user_status === 'active' ? t('ui.suspendAccount') : t('ui.restoreAccount')}</button><button disabled={busy} onClick={() => applyAction('force_logout', [selected.user_id])} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800'>{t('ui.signOutAllSessions')}</button><button disabled={busy || selected.user_status !== 'active'} onClick={() => issueResetLink(selected)} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50'>{t('ui.issuePasswordReset')}</button></div>}{resetLink && <div className='mt-5 rounded-xl bg-amber-50 p-4'><p className='text-xs font-semibold text-amber-950'>{t('ui.oneTimeResetLinkExpiresIn1Hour')}</p><p className='mt-2 break-all text-sm text-amber-950'>{resetLink}</p><button type='button' onClick={() => navigator.clipboard.writeText(resetLink)} className='mt-3 rounded-full border border-amber-800 px-3 py-1.5 text-xs font-semibold text-amber-950'>{t('ui.copyLink')}</button></div>}</section>}

    {showInvite && <div role='dialog' aria-modal='true' aria-label={t('ui.invitePerson')} className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4'><div className='w-full max-w-lg rounded-[2rem] bg-white p-7 shadow-2xl'><div className='flex justify-between gap-3'><h2 className='text-2xl font-semibold text-slate-950'>{t('ui.inviteAPerson')}</h2><button onClick={() => setShowInvite(false)} className='text-sm font-semibold text-slate-600'>{t('ui.close')}</button></div><p className='mt-2 text-sm text-slate-600'>{t('ui.sendTheOneTimeLinkThroughYourInstitutionSApproved')}</p><form onSubmit={issueInvite} className='mt-6 space-y-4'><label className='block text-sm font-semibold text-slate-700'>{t('ui.emailcbfd4c')}<input type='email' required value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} className='mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900' /></label><label className='block text-sm font-semibold text-slate-700'>{t('ui.role')}<select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as 'student' | 'lecturer')} className='mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900'><option value='lecturer'>{t('ui.lecturer')}</option><option value='student'>{t('ui.student')}</option></select></label>{inviteRole === 'student' ? <label className='block text-sm font-semibold text-slate-700'>{t('ui.class')}<select required value={inviteClassId} onChange={(event) => setInviteClassId(event.target.value)} className='mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900'><option value=''>{t('ui.selectAClass')}</option>{classes.map((item) => <option key={item.class_id} value={item.class_id}>{item.unit_id_unit} · {item.class_name}</option>)}</select></label> : <label className='block text-sm font-semibold text-slate-700'>{t('ui.courseLeadOptional')}<select value={inviteUnitId} onChange={(event) => setInviteUnitId(event.target.value)} className='mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-slate-900'><option value=''>{t('ui.noCourseLeadAssignment')}</option>{leadUnits.map((unit) => <option key={unit} value={unit}>{unit}</option>)}</select></label>}<button disabled={busy} className='rounded-full bg-teal-800 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50'>{busy ? t('ui.creating') : t('ui.createInvitation')}</button></form>{issuedLink && <div className='mt-5 rounded-xl bg-teal-50 p-4'><p className='text-xs font-semibold text-teal-900'>{t('ui.oneTimeLink')}</p><p className='mt-2 break-all text-sm text-teal-950'>{issuedLink}</p><button onClick={() => navigator.clipboard.writeText(issuedLink)} className='mt-3 rounded-full border border-teal-700 px-3 py-1.5 text-xs font-semibold text-teal-900'>{t('ui.copyLink')}</button></div>}</div></div>}
  </main>;
}
