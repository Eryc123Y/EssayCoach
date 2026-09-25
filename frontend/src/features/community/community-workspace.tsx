'use client';

import { usePreferences } from '@/components/layout/preference-provider';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { IconBookmark, IconFlag, IconHeart, IconMessageCircle, IconPlus, IconSearch, IconShield } from '@tabler/icons-react';
import { classService } from '@/service/api/v2/classes';
import { dashboardService } from '@/service/api/v2/dashboard';
import { socialService, type ContentReport, type SharedEssay, type SocialInteraction } from '@/service/api/v2/social';
import type { ClassItem, StudentEssay } from '@/service/api/v2/types';

type Role = 'student' | 'lecturer' | 'admin';
type Translate = (en: string, zh: string) => string;

export function CommunityWorkspace({ role }: { role: Role }) {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [mode, setMode] = useState<'feed' | 'mine' | 'moderation'>('feed');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [classId, setClassId] = useState('');
  const [tag, setTag] = useState('');
  const [sort, setSort] = useState<'recent' | 'trending'>('recent');
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [essays, setEssays] = useState<SharedEssay[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [published, setPublished] = useState<StudentEssay[]>([]);
  const [showShare, setShowShare] = useState(false);
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const loadMoreTarget = useRef<HTMLDivElement>(null);
  const loadingMore = useRef(false);
  const t: Translate = (en, zh) => language === 'zh' ? zh : en;
  const refresh = () => setRefreshKey((value) => value + 1);

  useEffect(() => {
    classService.listClasses().then(setClasses).catch((cause) => setError(String(cause)));
    if (role === 'student') {
      dashboardService.getStudentDashboard().then((data) => setPublished(data.myEssays.filter((essay) => essay.status === 'returned')))
        .catch((cause) => setError(String(cause)));
    }
  }, [role]);

  useEffect(() => {
    let active = true;
    setBusy(true);
    socialService.feed({
      search: deferredSearch, class_id: classId ? Number(classId) : undefined,
      tag, sort, mine: mode === 'mine', moderation: mode === 'moderation', limit: 20,
    }).then((rows) => {
      if (active) { setEssays(rows); setHasMore(rows.length === 20); setError(''); }
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : String(cause)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [deferredSearch, classId, tag, sort, mode, refreshKey]);

  useEffect(() => {
    if (mode !== 'moderation') return;
    socialService.reports('open').then(setReports).catch((cause) => setError(String(cause)));
  }, [mode, refreshKey]);

  async function loadMore() {
    if (loadingMore.current || busy || !hasMore) return;
    loadingMore.current = true;
    setBusy(true);
    try {
      const rows = await socialService.feed({
        search: deferredSearch, class_id: classId ? Number(classId) : undefined,
        tag, sort, mine: mode === 'mine', moderation: mode === 'moderation', limit: 20, offset: essays.length,
      });
      setEssays((current) => [...current, ...rows]);
      setHasMore(rows.length === 20);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { loadingMore.current = false; setBusy(false); }
  }

  useEffect(() => {
    const target = loadMoreTarget.current;
    if (!target || !hasMore || busy || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) void loadMore();
    }, { rootMargin: '240px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, busy, essays.length]);

  async function resolve(reportId: number, decision: 'keep' | 'hide' | 'remove') {
    setBusy(true);
    try { await socialService.resolve(reportId, decision); refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }

  return <main className='mx-auto max-w-6xl space-y-7 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-7 lg:px-10'>
    <header className='flex flex-wrap items-start justify-between gap-5'>
      <div><p className='text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / COMMUNITY</p><h1 className='mt-3 text-4xl font-semibold tracking-tight'>{t('Writing together', '一起写作')}</h1><p className='mt-3 max-w-2xl text-slate-600 dark:text-slate-300'>{t('Read released work, exchange specific feedback, and learn from one another.', '阅读自愿分享的已评分文章，交换具体反馈，共同进步。')}</p></div>
      <div className='flex flex-wrap gap-2'><button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'>{language === 'en' ? '中文' : 'English'}</button>{role === 'student' && <button type='button' onClick={() => setShowShare(true)} className='inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950'><IconPlus size={18} />{t('Share an essay', '分享文章')}</button>}</div>
    </header>

    <section className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
      <div className='flex flex-wrap gap-2'>{(['feed', ...(role === 'student' ? ['mine'] : []), ...(role !== 'student' ? ['moderation'] : [])] as typeof mode[]).map((item) => <button type='button' key={item} onClick={() => setMode(item)} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === item ? 'bg-slate-900 text-white dark:bg-teal-300 dark:text-slate-950' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}>{item === 'feed' ? t('Community feed', '社区动态') : item === 'mine' ? t('My shares', '我的分享') : t('Moderation', '内容管理')}</button>)}</div>
      <div className='mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'><label className='relative sm:col-span-2'><IconSearch size={18} className='absolute left-3 top-3 text-slate-400' /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Search essays, titles, captions', '搜索文章、标题与简介')} className='w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' /></label><select value={classId} onChange={(event) => setClassId(event.target.value)} aria-label={t('Filter class', '筛选班级')} className='rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800'><option value=''>{t('All classes', '所有班级')}</option>{classes.map((item) => <option key={item.class_id} value={item.class_id}>{item.class_name}</option>)}</select><select value={sort} onChange={(event) => setSort(event.target.value as 'recent' | 'trending')} aria-label={t('Sort essays', '排序')} className='rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm dark:border-slate-600 dark:bg-slate-800'><option value='recent'>{t('Recent', '最新')}</option><option value='trending'>{t('Most liked', '最多赞')}</option></select></div>
      {tag && <button type='button' onClick={() => setTag('')} className='mt-3 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200'>#{tag} ×</button>}
    </section>

    {mode === 'moderation' && <section className='rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900 dark:bg-amber-950'><h2 className='flex items-center gap-2 font-semibold text-amber-950 dark:text-amber-100'><IconShield size={19} />{t('Reports needing review', '待处理举报')} · {reports.length}</h2><div className='mt-4 space-y-3'>{reports.map((report) => <div key={report.id} className='flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-4 text-sm text-slate-800 dark:bg-slate-900 dark:text-slate-100'><p><strong>#{report.submission_id}</strong> · {report.reason}{report.description && <span className='ml-2 text-slate-500'>{report.description}</span>}</p><div className='flex flex-wrap gap-2'>{(['keep', 'hide', 'remove'] as const).map((decision) => <button key={decision} type='button' disabled={busy} onClick={() => resolve(report.id, decision)} className='rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold disabled:opacity-50'>{decision === 'keep' ? t('Keep', '保留') : decision === 'hide' ? t('Hide', '隐藏') : t('Remove', '移除')}</button>)}</div></div>)}{!reports.length && <p className='text-sm text-amber-800 dark:text-amber-200'>{t('No open reports.', '目前没有待处理举报。')}</p>}</div></section>}

    {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>{error}</p>}
    <div className='space-y-5'>{essays.map((essay) => <EssayCard key={essay.id} essay={essay} role={role} t={t} onRefresh={refresh} onError={setError} onTag={setTag} />)}</div>
    {busy && !essays.length && <p className='py-8 text-center text-sm text-slate-500'>{t('Loading shared writing…', '正在加载分享文章…')}</p>}
    {!busy && !essays.length && <div className='rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700'><h2 className='text-lg font-semibold'>{t('No essays here yet', '这里还没有文章')}</h2><p className='mt-2 text-sm text-slate-500'>{t('Try another filter or share a released essay.', '试试其他筛选条件，或分享一篇已发布成绩的文章。')}</p></div>}
    {hasMore && <div ref={loadMoreTarget} className='text-center'><button type='button' disabled={busy} onClick={loadMore} className='rounded-full border border-slate-300 px-6 py-2 text-sm font-semibold disabled:opacity-50'>{busy ? t('Loading more…', '正在加载更多…') : t('Load more', '加载更多')}</button></div>}
    {showShare && <ShareDialog essays={published} classes={classes} t={t} onClose={() => setShowShare(false)} onShared={() => { setShowShare(false); setMode('mine'); refresh(); }} onError={setError} />}
  </main>;
}

function ShareDialog({ essays, classes, t, onClose, onShared, onError }: { essays: StudentEssay[]; classes: ClassItem[]; t: Translate; onClose: () => void; onShared: () => void; onError: (value: string) => void }) {
  const [submissionId, setSubmissionId] = useState('');
  const [classId, setClassId] = useState('');
  const [visibility, setVisibility] = useState<SharedEssay['visibility']>('class');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      await socialService.share({ submission_id: Number(submissionId), class_id: classId ? Number(classId) : undefined, visibility, caption, tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean) });
      onShared();
    } catch (cause) { onError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  return <div role='dialog' aria-modal='true' aria-label={t('Share an essay', '分享文章')} className='fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4'><form onSubmit={submit} className='w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl'><div className='flex justify-between gap-4'><div><h2 className='text-2xl font-semibold'>{t('Share your writing', '分享你的文章')}</h2><p className='mt-1 text-sm text-slate-500'>{t('Only released essays can be shared. You control who sees them.', '只有成绩已发布的文章才能分享，可自行选择可见范围。')}</p></div><button type='button' onClick={onClose} aria-label={t('Close', '关闭')} className='text-xl'>×</button></div><label className='block text-sm font-semibold'>{t('Essay', '文章')}<select required value={submissionId} onChange={(event) => setSubmissionId(event.target.value)} className='mt-1 w-full rounded-xl border border-slate-300 px-3 py-2'><option value=''>{t('Choose an essay', '选择文章')}</option>{essays.map((essay) => <option key={essay.id} value={essay.id}>{essay.title} · {essay.score ?? '—'}</option>)}</select></label><label className='block text-sm font-semibold'>{t('Class for this essay', '文章所属班级')}<select value={classId} onChange={(event) => setClassId(event.target.value)} className='mt-1 w-full rounded-xl border border-slate-300 px-3 py-2'><option value=''>{t('Use assignment class', '使用作业班级')}</option>{classes.map((item) => <option key={item.class_id} value={item.class_id}>{item.class_name}</option>)}</select></label><label className='block text-sm font-semibold'>{t('Who can see it', '可见范围')}<select value={visibility} onChange={(event) => setVisibility(event.target.value as SharedEssay['visibility'])} className='mt-1 w-full rounded-xl border border-slate-300 px-3 py-2'><option value='class'>{t('My class', '我的班级')}</option><option value='public'>{t('Whole institution', '整个机构')}</option><option value='anonymous'>{t('Only my teachers and me', '仅教师和我')}</option></select></label><label className='block text-sm font-semibold'>{t('Caption', '简介')}<textarea maxLength={300} value={caption} onChange={(event) => setCaption(event.target.value)} rows={2} className='mt-1 w-full rounded-xl border border-slate-300 px-3 py-2' /></label><label className='block text-sm font-semibold'>{t('Tags, comma separated', '标签，用逗号分隔')}<input value={tags} onChange={(event) => setTags(event.target.value)} className='mt-1 w-full rounded-xl border border-slate-300 px-3 py-2' /></label><div className='flex justify-end gap-2'><button type='button' onClick={onClose} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold'>{t('Cancel', '取消')}</button><button type='submit' disabled={busy || !essays.length} className='rounded-full bg-teal-300 px-5 py-2 text-sm font-bold disabled:opacity-50'>{t('Share essay', '分享文章')}</button></div></form></div>;
}

function EssayCard({ essay, role, t, onRefresh, onError, onTag }: { essay: SharedEssay; role: Role; t: Translate; onRefresh: () => void; onError: (value: string) => void; onTag: (value: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [responses, setResponses] = useState<SocialInteraction[]>([]);
  const [comment, setComment] = useState('');
  const [kind, setKind] = useState<'comment' | 'feedback'>('feedback');
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('other');
  const [editing, setEditing] = useState(false);
  const [visibility, setVisibility] = useState(essay.visibility);
  const [busy, setBusy] = useState(false);
  async function action(run: () => Promise<unknown>) {
    setBusy(true);
    try { await run(); onRefresh(); onError(''); }
    catch (cause) { onError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setBusy(false); }
  }
  async function open() {
    if (!expanded) socialService.interactions(essay.submission_id).then(setResponses).catch((cause) => onError(String(cause)));
    setExpanded(!expanded);
  }
  async function sendResponse(event: React.FormEvent) {
    event.preventDefault();
    if (comment.trim().length < 3) return;
    await action(() => socialService.interact(essay.submission_id, kind, comment));
    setComment('');
    socialService.interactions(essay.submission_id).then(setResponses).catch(() => {});
  }
  return <article className='rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7'>
    <div className='flex flex-wrap items-start justify-between gap-3'><div><p className='text-xs font-bold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300'>{essay.class_name} · {essay.visibility === 'anonymous' ? t('Private to teachers', '仅教师可见') : essay.visibility === 'class' ? t('Class', '班级') : t('Institution', '机构')}</p><h2 className='mt-2 text-2xl font-semibold tracking-tight'>{essay.task_title}</h2><p className='mt-1 text-sm text-slate-500 dark:text-slate-300'>{essay.author} · {new Date(essay.created_at).toLocaleDateString()}{essay.status === 'hidden' && <span className='ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900'>{t('Hidden', '已隐藏')}</span>}</p></div>{essay.is_mine && <button type='button' onClick={() => setEditing(!editing)} className='rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold dark:border-slate-600'>{t('Sharing settings', '分享设置')}</button>}</div>
    {essay.caption && <p className='mt-5 text-sm leading-7 text-slate-700 dark:text-slate-200'>{essay.caption}</p>}
    <div className='mt-5 rounded-2xl bg-slate-50 p-5 font-serif text-base leading-8 text-slate-800 dark:bg-slate-800 dark:text-slate-100 whitespace-pre-wrap'>{expanded ? essay.essay_text : essay.essay_text.slice(0, 320)}{!expanded && essay.essay_text.length > 320 && '…'}</div>
    <div className='mt-4 flex flex-wrap gap-2'>{essay.tags.map((tag) => <button type='button' key={tag} onClick={() => onTag(tag)} className='rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200'>#{tag}</button>)}</div>
    {editing && <div className='mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3'><select aria-label={t('Visibility', '可见范围')} value={visibility} onChange={(event) => setVisibility(event.target.value as SharedEssay['visibility'])} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900'><option value='class'>{t('My class', '我的班级')}</option><option value='public'>{t('Institution', '机构')}</option><option value='anonymous'>{t('Teachers only', '仅教师')}</option></select><button type='button' disabled={busy} onClick={() => action(() => socialService.update(essay.submission_id, { visibility, caption: essay.caption, tags: essay.tags }))} className='rounded-full bg-teal-300 px-3 py-2 text-xs font-bold text-slate-950'>{t('Save', '保存')}</button><button type='button' disabled={busy} onClick={() => { if (window.confirm(t('Remove this essay from the feed?', '从动态中移除这篇文章？'))) action(() => socialService.remove(essay.submission_id)); }} className='rounded-full px-3 py-2 text-xs font-semibold text-red-700'>{t('Remove share', '移除分享')}</button></div>}
    <div className='mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700'><button type='button' disabled={busy} onClick={() => action(() => essay.liked_by_me ? socialService.removeToggle(essay.submission_id, 'like') : socialService.interact(essay.submission_id, 'like'))} aria-pressed={essay.liked_by_me} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold ${essay.liked_by_me ? 'bg-rose-50 text-rose-700' : 'text-slate-600 dark:text-slate-300'}`}><IconHeart size={18} />{essay.likes_count}</button><button type='button' disabled={busy} onClick={() => action(() => essay.bookmarked_by_me ? socialService.removeToggle(essay.submission_id, 'bookmark') : socialService.interact(essay.submission_id, 'bookmark'))} aria-pressed={essay.bookmarked_by_me} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold ${essay.bookmarked_by_me ? 'bg-teal-50 text-teal-800' : 'text-slate-600 dark:text-slate-300'}`}><IconBookmark size={18} />{essay.bookmarks_count}</button><button type='button' onClick={open} className='inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300'><IconMessageCircle size={18} />{essay.comments_count} {t('responses', '条回应')}</button><button type='button' onClick={() => setReporting(!reporting)} className='ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-500'><IconFlag size={16} />{t('Report', '举报')}</button></div>
    {reporting && <div className='mt-3 flex flex-wrap gap-2 rounded-xl bg-amber-50 p-3'><select value={reason} onChange={(event) => setReason(event.target.value)} aria-label={t('Report reason', '举报原因')} className='rounded-lg border border-amber-200 bg-white px-2 py-1 text-sm text-slate-900'><option value='spam'>{t('Spam', '垃圾内容')}</option><option value='offensive'>{t('Offensive', '冒犯性')}</option><option value='inappropriate'>{t('Inappropriate', '不合适')}</option><option value='other'>{t('Other', '其他')}</option></select><button type='button' disabled={busy} onClick={() => action(async () => { await socialService.report({ submission_id: essay.submission_id, reason, description: '' }); setReporting(false); })} className='rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-950'>{t('Submit report', '提交举报')}</button></div>}
    {expanded && <section className='mt-5 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-700'><p className='text-xs text-slate-500'>{t('Give specific, respectful feedback about the writing, not the writer.', '请针对文字给出具体、尊重的反馈，避免评价作者本人。')}</p>{responses.map((item) => <div key={item.id} className='rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800'><p className='font-semibold'>{item.author} <span className='font-normal text-slate-500'>· {item.interaction_type}</span></p><p className='mt-2 whitespace-pre-wrap'>{item.content}</p>{(item.is_mine || essay.can_moderate) && <button type='button' disabled={busy} onClick={() => action(async () => { await socialService.removeInteraction(item.id); setResponses((current) => current.filter((row) => row.id !== item.id)); })} className='mt-2 text-xs font-semibold text-red-700'>{t('Remove', '移除')}</button>}</div>)}<form onSubmit={sendResponse} className='flex flex-col gap-2'><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} placeholder={t('What works well? What could be clearer?', '哪些部分写得好？哪里还可以更清楚？')} className='w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' /><div className='flex justify-end gap-2'><select value={kind} onChange={(event) => setKind(event.target.value as 'comment' | 'feedback')} aria-label={t('Response type', '回应类型')} className='rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-900'><option value='feedback'>{t('Feedback', '同伴反馈')}</option><option value='comment'>{t('Comment', '评论')}</option></select><button type='submit' disabled={busy || comment.trim().length < 3} className='rounded-full bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50'>{t('Post response', '发表回应')}</button></div></form></section>}
    {role !== 'student' && essay.can_moderate && <div className='mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 text-xs dark:border-slate-700'><button type='button' disabled={busy} onClick={() => action(() => essay.status === 'hidden' ? socialService.restore(essay.submission_id) : socialService.hide(essay.submission_id))} className='rounded-full border border-slate-300 px-3 py-1.5 font-semibold'>{essay.status === 'hidden' ? t('Restore post', '恢复文章') : t('Hide post', '隐藏文章')}</button>{essay.user_id && <button type='button' disabled={busy} onClick={() => { const reason = window.prompt(t('Reason for a two-day posting pause', '暂停发帖两天的原因')); if (reason && reason.trim().length >= 3) action(() => socialService.ban(essay.user_id!, { class_id: essay.class_id, days: 2, reason })); }} className='rounded-full border border-slate-300 px-3 py-1.5 font-semibold'>{t('Pause posting', '暂停发帖')}</button>}</div>}
  </article>;
}
