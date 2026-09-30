'use client';

import { localized } from '@/locales';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, FileText, Loader2 } from 'lucide-react';
import { authService, taskService } from '@/service/api/v2';
import type { Task, TaskSubmission, TaskSubmissionSummary } from '@/service/api/v2/types';
import type { TaskRubric } from '@/service/api/v2/tasks';
import { usePreferences } from '@/components/layout/preference-provider';

export function TaskDetail({ taskId, role }: { taskId: number; role: 'student' | 'lecturer' | 'admin' }) {
  const { locale: language, changeLocale } = usePreferences();
  const [task, setTask] = useState<Task | null>(null);
  const [rubric, setRubric] = useState<TaskRubric | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [summary, setSummary] = useState<TaskSubmissionSummary | null>(null);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<number[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [personalDeadline, setPersonalDeadline] = useState<string | null>(null);
  const [deadlineExtended, setDeadlineExtended] = useState(false);
  const [content, setContent] = useState('');
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const t = (en: string, zh?: string) => localized(language, en, zh);
  const draftKey = `essaycoach:formal-draft:${taskId}`;

  const refresh = useCallback(async () => {
    const [nextTask, nextRubric, nextSubmissions, me, deadline, nextSummary] = await Promise.all([
      taskService.getTask(taskId),
      taskService.getTaskRubric(taskId),
      taskService.getTaskSubmissions(taskId),
      role === 'student' ? authService.getUserInfo() : Promise.resolve(null),
      role === 'student' ? taskService.getMyDeadline(taskId) : Promise.resolve(null),
      role !== 'student' ? taskService.getSubmissionSummary(taskId) : Promise.resolve(null),
    ]);
    setTask(nextTask);
    setRubric(nextRubric);
    setSubmissions([...nextSubmissions].sort((a, b) => b.submission_id - a.submission_id));
    setUserId(me?.user_id ?? null);
    setPersonalDeadline(deadline?.effective_deadline ?? null);
    setDeadlineExtended(deadline?.is_extended ?? false);
    setSummary(nextSummary);
    setError('');
  }, [taskId, role]);

  useEffect(() => {
    if (role === 'student') setContent(localStorage.getItem(draftKey) ?? '');
    void refresh().catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load assignment.'))
      .finally(() => setLoading(false));
  }, [draftKey, refresh, role]);

  useEffect(() => {
    if (role === 'student' && !loading && (
      submissions.length === 0 || (submissions.length === 1 && task?.task_allow_resubmission)
    )) {
      localStorage.setItem(draftKey, content);
    }
  }, [content, draftKey, loading, role, submissions.length, task?.task_allow_resubmission]);

  async function submit() {
    if (!confirmSubmit || !userId || !content.trim() || busy) return;
    setBusy(true);
    try {
      await taskService.submitEssay(taskId, userId, content.trim());
      localStorage.removeItem(draftKey);
      setConfirmSubmit(false);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.submissionFailed'));
    } finally {
      setBusy(false);
    }
  }

  async function downloadSubmissions() {
    setBusy(true);
    try {
      const blob = await taskService.exportSubmissions(taskId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `assignment-${taskId}-submissions.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.exportFailed'));
    } finally {
      setBusy(false);
    }
  }

  const ownSubmission = role === 'student' ? submissions[0] : null;
  const effectiveDeadline = personalDeadline ?? task?.task_due_datetime;
  const deadlinePassed = effectiveDeadline ? new Date(effectiveDeadline).getTime() < Date.now() : false;
  const canSubmit = role === 'student' && task?.task_status === 'published'
    && submissions.length < (task.task_allow_resubmission ? 2 : 1)
    && (!deadlinePassed || task.task_allow_late_submission);

  return <main className='mx-auto max-w-6xl space-y-7 px-5 py-8 md:px-9'>
    <div className='flex items-center justify-between gap-3'><Link href='/dashboard/tasks' className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700'><ArrowLeft size={16} />{t('ui.allAssignments')}</Link><button type='button' className='rounded-full border border-slate-200 px-4 py-2 text-sm' onClick={() => void changeLocale(language === 'en' ? 'zh' : 'en')}>{language === 'en' ? '中文' : 'EN'}</button></div>
    {error && <div role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800'>{error}</div>}
    {loading ? <div className='flex items-center gap-2 text-slate-600'><Loader2 size={17} className='animate-spin' />{t('ui.openingAssignment')}</div> : task && <>
      <header className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'><span className='text-xs font-semibold uppercase tracking-[.18em] text-blue-700'>{t('ui.courseAssignment')} · {task.unit_id_unit}</span><h1 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900'>{task.task_title}</h1><p className='mt-3 leading-7 text-slate-600'>{task.task_desc}</p><div className='mt-5 flex flex-wrap gap-3 text-sm text-slate-600'><span className='inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2'><CalendarDays size={16} />{deadlineExtended ? t('ui.yourExtendedDeadline') : t('ui.due')} {new Date(effectiveDeadline ?? task.task_due_datetime).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</span><span className='rounded-full bg-blue-50 px-4 py-2 font-medium text-blue-800'>{({ draft: t('ui.draft'), published: t('ui.published'), unpublished: t('ui.unpublished'), archived: t('ui.archived') } as Record<string, string>)[task.task_status] || task.task_status}</span></div></header>
      <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.7fr)]'><div className='space-y-6'>
        <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'><h2 className='text-xl font-semibold text-slate-900'>{t('ui.instructions')}</h2><div className='mt-5 whitespace-pre-wrap leading-7 text-slate-700'>{task.task_instructions || t('ui.followTheAttachedRubric')}</div></section>
        {role === 'student' && <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'><h2 className='flex items-center gap-2 text-xl font-semibold text-slate-900'><FileText size={19} />{t('ui.yourSubmission')}</h2>{ownSubmission && canSubmit && <p className='mt-3 text-sm text-blue-800'>{t('ui.yourFirstVersionWasSubmittedYouMaySubmitOneRevised')} <Link href={`/dashboard/submissions/${ownSubmission.submission_id}`} className='font-semibold underline'>{t('ui.viewOriginal')}</Link></p>}{ownSubmission && !canSubmit ? <><p className='mt-3 text-sm text-emerald-800'>{t('ui.submittedSuccessfullyYourEssayCannotBeEditedAfterSubmis')}</p><Link href={`/dashboard/submissions/${ownSubmission.submission_id}`} className='mt-5 inline-block rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white'>{t('ui.viewSubmissionAndResult')}</Link></> : canSubmit ? <><p className='mt-2 text-sm text-slate-500'>{t('ui.yourTextIsSavedInThisBrowserWhileYouWork')}</p><textarea aria-label={t('ui.formalEssayText')} value={content} maxLength={50000} onChange={event => setContent(event.target.value)} className='mt-5 min-h-80 w-full rounded-2xl border border-slate-300 p-5 font-serif leading-8 text-slate-900 focus:border-blue-600 focus:outline-none' placeholder={t('ui.writeYourEssayHere')} /><div className='mt-3 text-right text-xs text-slate-500'>{content.length.toLocaleString()} / 50,000</div>{confirmSubmit ? <div className='mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5'><p className='text-sm font-medium text-amber-950'>{t('ui.thisFormalSubmissionWillBeLockedForAssessmentCheckYour')}</p><div className='mt-4 flex flex-wrap gap-3'><button type='button' disabled={busy} onClick={() => void submit()} className='rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'>{busy ? t('ui.submitting') : t('ui.submitEssayaef0d5')}</button><button type='button' onClick={() => setConfirmSubmit(false)} className='rounded-full border border-slate-300 px-5 py-3 text-sm'>{t('ui.keepEditing')}</button></div></div> : <button type='button' disabled={!content.trim()} onClick={() => setConfirmSubmit(true)} className='mt-5 rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'>{t(ownSubmission ? 'ui.reviewRevision' : 'ui.reviewAndSubmit')}</button>}</> : <p className='mt-3 text-sm text-slate-600'>{deadlinePassed ? t('ui.theDeadlineHasPassed') : t('ui.thisAssignmentIsNotOpenForSubmission')}</p>}</section>}
        {role === 'student' && submissions.length > 1 && <section className='rounded-3xl border border-slate-200 bg-white p-7'><h2 className='text-lg font-semibold'>{t('ui.submissionHistory')}</h2><div className='mt-3 space-y-2'>{submissions.map((item, index) => <Link key={item.submission_id} href={`/dashboard/submissions/${item.submission_id}`} className='block rounded-xl border px-4 py-3 text-sm text-blue-700'>{index === 0 ? t('ui.revisedVersion') : t('ui.originalVersion')} · {new Date(item.submission_time).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</Link>)}</div></section>}{role !== 'student' && <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'><div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'><div><h2 className='text-xl font-semibold text-slate-900'>{t('ui.studentSubmissions')}</h2>{summary && <p className='mt-1 text-sm text-slate-500'>{t('ui.submitted667f11')} {summary.submitted_students}/{summary.eligible_students}{summary.submission_versions > summary.submitted_students ? ` · ${summary.submission_versions} ${t('ui.versions')}` : ''}</p>}</div><div className='flex flex-wrap items-center gap-3'>{selectedSubmissionIds.length > 0 && <Link href={`/dashboard/review/${selectedSubmissionIds[0]}?queue=${selectedSubmissionIds.join(',')}`} className='text-sm font-medium text-blue-700'>{t('ui.reviewSelected')} ({selectedSubmissionIds.length})</Link>}<button type='button' disabled={busy || !summary?.submission_versions} onClick={() => void downloadSubmissions()} className='rounded-full border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 disabled:opacity-50'>{t('ui.downloadEssays')}</button><Link href={`/dashboard/tasks/${taskId}/edit`} className='rounded-full border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700'>{t('ui.editAssignment')}</Link></div></div>{submissions.length === 0 ? <p className='mt-5 text-sm text-slate-500'>{t('ui.noSubmissionsYetcda3fe')}</p> : <div className='mt-5 divide-y divide-slate-100'>{submissions.map(item => <div key={item.submission_id} className='flex items-center justify-between gap-4 py-4'><input type='checkbox' aria-label={`${t('ui.selectSubmission')} #${item.submission_id}`} checked={selectedSubmissionIds.includes(item.submission_id)} onChange={event => setSelectedSubmissionIds(previous => event.target.checked ? [...previous, item.submission_id] : previous.filter(id => id !== item.submission_id))} className='h-4 w-4 accent-blue-700' /><div className='min-w-0 flex-1'><p className='font-medium text-slate-900'>{item.student_name || `${t('ui.student')} #${item.user_id_user}`}</p><p className='mt-1 text-xs text-slate-500'>{new Date(item.submission_time).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</p></div><Link href={`/dashboard/review/${item.submission_id}`} className='rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700'>{t('ui.review')}</Link></div>)}</div>}</section>}
      </div><aside className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'><h2 className='text-xl font-semibold text-slate-900'>{t('ui.assessmentRubric')}</h2><p className='mt-2 text-sm text-slate-500'>{rubric?.description}{rubric?.version ? ` · ${t('ui.version')} ${rubric.version}` : ''}</p><div className='mt-6 space-y-4'>{rubric?.items.length ? rubric.items.map(item => <div key={item.id} className='border-t border-slate-100 pt-4'><div className='flex justify-between gap-3'><strong className='text-sm text-slate-900'>{item.name}</strong><span className='text-sm text-slate-500'>/ {item.max_score}</span></div>{item.levels.map((level, index) => <p key={index} className='mt-2 text-xs leading-5 text-slate-600'>{level.min}–{level.max}: {level.description}</p>)}</div>) : <p className='text-sm text-slate-500'>{t('ui.theRubricHasNoCriteriaYet')}</p>}</div></aside></div>
    </>}
  </main>;
}
