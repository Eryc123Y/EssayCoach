'use client';

import { localized } from '@/locales';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconCamera, IconChartBar, IconMedal, IconPencil, IconRefresh } from '@tabler/icons-react';
import { authService, settingsService } from '@/service/api/v2/auth';
import { usePreferences } from '@/components/layout/preference-provider';
import { portfolioService, type PortfolioProfile, type PortfolioUpdate } from '@/service/api/v2/profile-portfolio';

type Tab = 'essays' | 'achievements' | 'progress';

export function PortfolioWorkspace({ profileId }: { profileId?: number }) {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [profile, setProfile] = useState<PortfolioProfile>();
  const [myId, setMyId] = useState<number>();
  const [draft, setDraft] = useState<PortfolioUpdate>();
  const [tab, setTab] = useState<Tab>('essays');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const t = (en: string, zh?: string) => localized(language, en, zh);
  const own = Boolean(profile && myId === profile.user_id);

  useEffect(() => {
    let active = true;
    setBusy(true);
    authService.getUserInfo().then(async (user) => {
      const target = profileId || user.user_id;
      const data = await portfolioService.get(target);
      if (active) {
        setMyId(user.user_id);
        setProfile(data);
        setDraft({
          bio: data.bio,
          visibility: data.visibility || 'classmates',
          show_essays: data.show_essays ?? false,
          show_scores: data.show_scores ?? false,
        });
        setError('');
      }
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : String(cause)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [profileId]);

  async function save() {
    if (!draft) return;
    setBusy(true);
    try {
      const data = await portfolioService.update(draft);
      setProfile(data);
      setEditing(false);
      setNotice(t('ui.profileSaved'));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 5 * 1024 * 1024) {
        throw new Error(t('ui.chooseAPngOrJpgUnder5Mb'));
      }
      const result = await settingsService.uploadAvatar(file);
      setProfile((current) => current ? { ...current, avatar_url: result.avatar_url } : current);
      setNotice(t('ui.avatarUpdated'));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  const released = profile?.history.filter((essay) => essay.released && essay.score !== null).reverse() ?? [];
  return <main className='mx-auto max-w-6xl space-y-7 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-7 lg:px-10'>
    <header className='flex flex-wrap items-start justify-between gap-5'>
      <div><p className='text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / PROFILE</p><h1 className='mt-3 text-4xl font-semibold tracking-tight'>{t('ui.writingProfile')}</h1><p className='mt-3 text-slate-600 dark:text-slate-300'>{t('ui.yourWritingJourneyAchievementsAndPrivacyChoices')}</p></div>
      <button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'>{language === 'en' ? '中文' : 'English'}</button>
    </header>

    {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>{error}</p>}
    {notice && <p role='status' className='rounded-xl bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100'>{notice}</p>}
    {busy && !profile && <p className='inline-flex items-center gap-2 text-sm text-slate-500'><IconRefresh className='animate-spin' size={16} />{t('ui.loadingProfile')}</p>}

    {profile && <>
      <section className='relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <div className='h-24 bg-gradient-to-r from-teal-200 via-sky-100 to-amber-100 dark:from-teal-950 dark:via-slate-800 dark:to-amber-950' />
        <div className='flex flex-wrap items-start gap-5 px-6 pb-6 sm:px-8'>
          <div className='relative -mt-11 grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-teal-800 text-3xl font-semibold text-white shadow-md dark:border-slate-900'>
            {profile.avatar_url ? <img src={profile.avatar_url} alt={profile.name} className='h-full w-full object-cover' /> : profile.name.slice(0, 1).toUpperCase()}
            {own && <label className='absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center bg-slate-950/75 py-1 text-white' aria-label={t('ui.uploadAvatar')}><IconCamera size={16} /><input type='file' accept='image/png,image/jpeg' onChange={(event) => { void upload(event.target.files?.[0]); }} className='sr-only' /></label>}
          </div>
          <div className='min-w-0 flex-1 pt-3'><p className='text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300'>{t(`ui.${profile.role}`)}</p><h2 className='mt-1 text-2xl font-semibold'>{profile.name}</h2><p className='mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300'>{profile.bio || t('ui.aStoryStillTakingShape')}</p><p className='mt-2 text-xs text-slate-500'>{t('ui.joined')} {new Date(profile.joined_at).toLocaleDateString()}</p></div>
          {own && <button type='button' onClick={() => setEditing(!editing)} className='mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'><IconPencil size={16} />{editing ? t('ui.closeEditor') : t('ui.editProfile')}</button>}
        </div>
      </section>

      {editing && own && draft && <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900'><h2 className='text-lg font-semibold'>{t('ui.aboutAndPrivacy')}</h2><div className='mt-5 grid gap-5 sm:grid-cols-2'>
        <label className='grid gap-2 text-sm font-semibold sm:col-span-2'>{t('ui.introduction')}<textarea maxLength={300} rows={3} value={draft.bio} onChange={(event) => setDraft({ ...draft, bio: event.target.value })} className='rounded-xl border border-slate-300 bg-white p-3 font-normal dark:border-slate-600 dark:bg-slate-800' /></label>
        <label className='grid gap-2 text-sm font-semibold'>{t('ui.profileVisibility')}<select value={draft.visibility} onChange={(event) => setDraft({ ...draft, visibility: event.target.value as PortfolioUpdate['visibility'] })} className='rounded-xl border border-slate-300 bg-white p-3 font-normal dark:border-slate-600 dark:bg-slate-800'><option value='private'>{t('ui.onlyMeAndTeachingStaff')}</option><option value='classmates'>{t('ui.classmates')}</option><option value='institution'>{t('ui.institutionMembers')}</option></select></label>
        <div className='grid gap-3 text-sm'><label className='flex items-center gap-2'><input type='checkbox' checked={draft.show_essays} onChange={(event) => setDraft({ ...draft, show_essays: event.target.checked })} />{t('ui.showReleasedEssayTitles')}</label><label className='flex items-center gap-2'><input type='checkbox' checked={draft.show_scores} onChange={(event) => setDraft({ ...draft, show_scores: event.target.checked })} />{t('ui.showReleasedScores')}</label></div>
      </div><div className='mt-5 flex items-center gap-3'><button type='button' disabled={busy} onClick={() => { void save(); }} className='rounded-full bg-teal-300 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-50'>{t('ui.saveProfile')}</button><Link href='/dashboard/settings' className='text-sm font-semibold text-teal-700 dark:text-teal-300'>{t('ui.accountSettings')}</Link></div></section>}

      <section className='grid gap-4 sm:grid-cols-3' aria-label={t('ui.profileStatistics')}>
        <Stat label={t('ui.submissions08316d')} value={profile.total_submissions} />
        <Stat label={t('ui.releasedAverage')} value={profile.average_score === null ? null : `${profile.average_score}%`} />
        <Stat label={t('ui.achievements')} value={profile.badges.length} />
      </section>

      {profile.role === 'lecturer' && <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'><Stat label={t('ui.classesTaught')} value={profile.classes.length} /><Stat label={t('ui.studentsTaught')} value={profile.students_taught} /><Stat label={t('ui.rubricsCreated')} value={profile.rubrics_created} /><Stat label={t('ui.reviewsCompleted')} value={profile.reviews_completed} /></section>}
      {profile.role === 'lecturer' && <section className='rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900'><h2 className='text-lg font-semibold'>{t('ui.classesTaught')}</h2>{profile.classes.length ? <ul className='mt-3 grid gap-2 sm:grid-cols-2'>{profile.classes.map((item) => <li key={item.id}><Link href={`/dashboard/classes/${item.id}`} className='block rounded-xl border border-slate-200 p-3 text-sm font-semibold text-teal-800 hover:border-teal-500 dark:border-slate-700 dark:text-teal-300'>{item.name}</Link></li>)}</ul> : <p className='mt-3 text-sm text-slate-500'>{t('ui.noClassesCurrentlyAssigned')}</p>}</section>}

      <section className='rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
        <div className='flex gap-2 overflow-x-auto border-b border-slate-200 px-4 pt-4 dark:border-slate-700' role='tablist' aria-label={t('ui.profileSections')}>
          {(['essays', 'achievements', 'progress'] as const).map((item) => <button key={item} type='button' role='tab' aria-selected={tab === item} onClick={() => setTab(item)} className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${tab === item ? 'border-teal-600 text-teal-800 dark:text-teal-300' : 'border-transparent text-slate-500'}`}>{item === 'essays' ? t('ui.essays') : item === 'achievements' ? t('ui.achievements') : t('ui.progress')}</button>)}
        </div>
        <div className='p-5 sm:p-7' role='tabpanel'>
          {tab === 'essays' && (profile.history.length ? <div className='space-y-3'>{profile.history.map((essay) => <div key={essay.id} className='flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700'><div><strong className='block text-sm'>{essay.title}</strong><small className='mt-1 block text-slate-500'>{new Date(essay.submitted_at).toLocaleDateString()} · {essay.released ? t('ui.resultReleased') : t('ui.awaitingRelease')}</small></div><div className='flex items-center gap-3'>{essay.score !== null && <strong className='text-lg text-teal-800 dark:text-teal-300'>{essay.score}%</strong>}{own && <Link href={`/dashboard/submissions/${essay.id}`} className='text-sm font-semibold text-teal-700 dark:text-teal-300'>{t('ui.open')}</Link>}</div></div>)}</div> : <Empty text={t('ui.noVisibleEssaysYet')} />)}
          {tab === 'achievements' && (profile.badges.length ? <div className='grid gap-3 sm:grid-cols-2'>{profile.badges.map((badge) => <div key={badge.id} className='rounded-xl bg-amber-50 p-4 dark:bg-amber-950/30'><IconMedal className='text-amber-700' size={23} /><strong className='mt-2 block'>{language === 'zh' ? ({ 'First Essay': '第一篇作文', 'Building Momentum': '持续写作', 'Five Essays': '五篇作文', 'Ten Essays': '十篇作文' } as Record<string, string>)[badge.name] || badge.name : badge.name}</strong><p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>{language === 'zh' ? ({ 'First Essay': '已提交第一篇正式作文', 'Building Momentum': '已提交三篇正式作文', 'Five Essays': '已提交五篇正式作文', 'Ten Essays': '已提交十篇正式作文' } as Record<string, string>)[badge.name] || badge.description : badge.description}</p><small className='mt-2 block text-slate-500'>{new Date(badge.earned_at).toLocaleDateString()}</small></div>)}</div> : <Empty text={t('ui.achievementsAppearAsYouReachWritingMilestones')} />)}
          {tab === 'progress' && (released.length ? <div className='space-y-5'><p className='flex items-center gap-2 text-sm text-slate-500'><IconChartBar size={17} />{t('ui.releasedResultsOverTime')}</p>{released.map((essay) => <div key={essay.id} className='grid grid-cols-[7rem_1fr_3rem] items-center gap-3 text-xs sm:grid-cols-[12rem_1fr_3rem]'><span className='truncate'>{essay.title}</span><div className='h-3 rounded-full bg-slate-100 dark:bg-slate-800'><div className='h-3 rounded-full bg-teal-500' style={{ width: `${Math.max(0, Math.min(essay.score ?? 0, 100))}%` }} /></div><strong>{essay.score}%</strong></div>)}</div> : <Empty text={t('ui.progressAppearsAfterResultsAreReleasedAndVisible')} />)}
        </div>
      </section>
    </>}
  </main>;
}

function Stat({ label, value }: { label: string; value: number | string | null }) {
  return <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'><p className='text-xs font-bold uppercase tracking-widest text-slate-500'>{label}</p><strong className='mt-3 block text-3xl'>{value ?? '—'}</strong></div>;
}

function Empty({ text }: { text: string }) {
  return <p className='rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800'>{text}</p>;
}
