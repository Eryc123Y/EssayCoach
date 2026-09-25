'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, RotateCcw } from 'lucide-react';
import { usePreferences } from '@/components/layout/preference-provider';
import {
  assessmentService,
  type AssessmentCriterion,
  type FormalAIJob,
  type FormalAssessment,
  type FormalSubmission
} from '@/service/api/v2/assessment';

type EditItem = Pick<AssessmentCriterion, 'rubric_item_id' | 'score' | 'comment'>;

export function AssessmentWorkspace({ submissionId, queue = [] }: { submissionId: number; queue?: number[] }) {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [submission, setSubmission] = useState<FormalSubmission | null>(null);
  const [assessment, setAssessment] = useState<FormalAssessment | null>(null);
  const [job, setJob] = useState<FormalAIJob | null>(null);
  const [items, setItems] = useState<EditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [error, setError] = useState('');
  const t = (en: string, zh: string) => language === 'zh' ? zh : en;

  const refresh = useCallback(async () => {
    const [nextSubmission, nextAssessment, nextJob] = await Promise.all([
      assessmentService.getSubmission(submissionId),
      assessmentService.getAssessment(submissionId),
      assessmentService.getJob(submissionId)
    ]);
    setSubmission(nextSubmission);
    setAssessment(nextAssessment);
    setJob(nextJob);
    setItems(nextAssessment.items.map(item => ({
      rubric_item_id: item.rubric_item_id, score: item.score, comment: item.comment
    })));
    setError('');
  }, [submissionId]);

  useEffect(() => {
    void refresh().catch(cause => setError(cause instanceof Error ? cause.message : 'Could not load review.'))
      .finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (assessment?.status !== 'ai_pending' || job?.status === 'failed') return;
    const timer = setInterval(() => void refresh().catch(() => {}), 3000);
    return () => clearInterval(timer);
  }, [assessment?.status, job?.status, refresh]);

  async function review() {
    if (!assessment || busy) return;
    setBusy(true);
    try {
      const updated = await assessmentService.review(submissionId, assessment.version, items);
      setAssessment(updated);
      setItems(updated.items.map(item => ({
        rubric_item_id: item.rubric_item_id, score: item.score, comment: item.comment
      })));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Review could not be saved.', '无法保存复核结果。'));
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!assessment || !confirmRelease || busy) return;
    setBusy(true);
    try {
      const updated = await assessmentService.publish(submissionId, assessment.version);
      setAssessment(updated);
      setConfirmRelease(false);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Publication failed.', '发布失败。'));
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    if (!job || busy) return;
    setBusy(true);
    try {
      setJob(await assessmentService.retryJob(job.job_id));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('Retry failed.', '重试失败。'));
    } finally {
      setBusy(false);
    }
  }

  const snapshot = assessment?.rubric_snapshot ?? [];
  const validItems = snapshot.length > 0 && items.length === snapshot.length && snapshot.every(criterion => {
    const item = items.find(value => value.rubric_item_id === criterion.id);
    return item && Number.isInteger(item.score) && item.score >= 0 && item.score <= criterion.max_score;
  });
  const queuePosition = queue.indexOf(submissionId);
  const nextSubmissionId = queuePosition >= 0 ? queue[queuePosition + 1] : undefined;
  const remainingQueue = nextSubmissionId ? queue.slice(queuePosition + 1) : [];

  return <main className='mx-auto max-w-6xl space-y-7 px-5 py-8 md:px-9'>
    <div className='flex items-center justify-between gap-3'>
      <Link href='/dashboard/lecturer' className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700'><ArrowLeft size={16} />{t('Back to teaching dashboard', '返回教师看板')}</Link>
      <div className='flex flex-wrap items-center gap-2'>{nextSubmissionId && <Link href={`/dashboard/review/${nextSubmissionId}?queue=${remainingQueue.join(',')}`} className='rounded-full border border-blue-600 px-4 py-2 text-sm font-medium text-blue-700'>{t('Next selected submission', '下一份已选文章')}</Link>}<button type='button' className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>{language === 'en' ? '中文' : 'EN'}</button></div>
    </div>
    <header className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'>
      <span className='text-xs font-semibold uppercase tracking-[.18em] text-blue-700'>{t('Formal assessment', '正式评估')}</span>
      <h1 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900'>{t('Review submission', '复核提交')} #{submissionId}</h1>
      <p className='mt-2 text-sm text-slate-500'>{t('AI proposes; the lecturer reviews; the course lead confirms release.', 'AI 提出建议，教师复核，课程负责人确认发布。')}</p>
      {assessment && <div className='mt-6 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900'>{assessment.status === 'published' ? <CheckCircle2 size={18} /> : <Clock3 size={18} />}{assessment.status === 'ai_pending' ? t('AI scoring in progress', 'AI 正在评分') : assessment.status === 'ai_draft' ? t('AI proposal ready for review', 'AI 建议分数待复核') : assessment.status === 'lecturer_reviewed' ? t('Reviewed; awaiting course lead release', '已复核，等待课程负责人发布') : t('Published to student', '已向学生发布')}</div>}
    </header>

    {error && <div role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800'>{error}<button type='button' className='ml-3 underline' onClick={() => void refresh().catch(() => {})}>{t('Reload', '重新加载')}</button></div>}
    {loading ? <div className='flex items-center gap-2 text-slate-600'><Loader2 size={18} className='animate-spin' />{t('Opening review…', '正在打开复核页面……')}</div> : submission && assessment && <div className='grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(350px,.9fr)]'>
      <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'><h2 className='text-xl font-semibold text-slate-900'>{t('Student essay', '学生文章')}</h2><p className='mt-2 text-xs text-slate-500'>{t('Submitted', '提交时间')} {new Date(submission.submission_time).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</p><div className='mt-6 whitespace-pre-wrap border-t border-slate-100 pt-6 font-serif text-base leading-8 text-slate-800'>{submission.submission_txt}</div></section>
      <div className='space-y-6'>
        {assessment.status === 'ai_pending' && <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm'><h2 className='text-lg font-semibold'>{t('AI scoring job', 'AI 评分任务')}</h2><p className='mt-2 text-sm text-slate-600'>{job?.status === 'failed' ? job.error_message || t('Scoring stopped.', '评分已中断。') : t('The report will appear when the worker finishes.', '工作进程完成后，这里会出现评分建议。')}</p>{job?.status === 'failed' && <button type='button' disabled={busy} onClick={() => void retry()} className='mt-5 inline-flex items-center gap-2 rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50'><RotateCcw size={16} />{t('Retry scoring', '重试评分')}</button>}</section>}
        {(assessment.status === 'ai_draft' || assessment.status === 'lecturer_reviewed' || assessment.status === 'published') && <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm'><div className='flex items-center justify-between gap-3'><div><span className='text-xs font-semibold uppercase tracking-[.18em] text-blue-700'>{t('Rubric review', '量规复核')}</span><h2 className='mt-2 text-xl font-semibold'>{t('Criterion scores', '细项分数')}</h2></div>{assessment.ai_proposal && <span className='rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600'>{assessment.ai_proposal.model}</span>}</div>
          <div className='mt-5 space-y-5'>{snapshot.map(criterion => {
            const item = items.find(value => value.rubric_item_id === criterion.id);
            const proposal = assessment.ai_proposal?.items.find(value => value.rubric_item_id === criterion.id);
            return <div key={criterion.id} className='rounded-2xl border border-slate-200 p-4'><div className='flex items-start justify-between gap-3'><div><h3 className='font-medium text-slate-900'>{criterion.name}</h3><p className='mt-1 text-xs text-slate-500'>{t('AI suggested', 'AI 建议')} {proposal?.score ?? '—'} / {criterion.max_score}</p></div><label className='text-xs text-slate-600'>{t('Reviewed score', '复核分数')}<input type='number' min={0} max={criterion.max_score} step={1} disabled={assessment.status === 'published'} value={item?.score ?? ''} onChange={event => setItems(previous => previous.map(value => value.rubric_item_id === criterion.id ? { ...value, score: event.target.value === '' ? NaN : Number(event.target.value) } : value))} className='mt-1 block w-24 rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 disabled:bg-slate-50' /></label></div><label className='mt-4 block text-xs text-slate-600'>{t('Teacher comment', '教师评语')}<textarea disabled={assessment.status === 'published'} value={item?.comment ?? ''} onChange={event => setItems(previous => previous.map(value => value.rubric_item_id === criterion.id ? { ...value, comment: event.target.value } : value))} className='mt-1 min-h-24 w-full rounded-lg border border-slate-300 p-3 text-sm leading-6 text-slate-900 disabled:bg-slate-50' /></label></div>;
          })}</div>
          {assessment.status !== 'published' && <button type='button' disabled={busy || !validItems} onClick={() => void review()} className='mt-6 w-full rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'>{busy ? t('Saving…', '保存中……') : t('Save teacher review', '保存教师复核')}</button>}
          {assessment.status === 'published' && <p className='mt-5 text-sm font-medium text-emerald-800'>{t('Final score', '最终成绩')}: {assessment.final_score} / 100</p>}
        </section>}
        {assessment.status === 'lecturer_reviewed' && <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm'><h2 className='text-lg font-semibold'>{t('Release decision', '成绩发布确认')}</h2>{assessment.can_publish ? <><p className='mt-2 text-sm leading-6 text-slate-600'>{t('Confirm that the reviewed scores and comments are ready for the student. Publishing makes the final result visible.', '请确认复核后的分数与评语可以交给学生。发布后，学生将看到最终结果。')}</p>{confirmRelease ? <div className='mt-5 flex flex-wrap gap-3'><button type='button' disabled={busy} onClick={() => void publish()} className='rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50'>{t('Publish final grade', '发布最终成绩')}</button><button type='button' onClick={() => setConfirmRelease(false)} className='rounded-full border border-slate-300 px-5 py-3 text-sm'>{t('Cancel', '取消')}</button></div> : <button type='button' onClick={() => setConfirmRelease(true)} className='mt-5 rounded-full border border-emerald-700 px-5 py-3 text-sm font-semibold text-emerald-800'>{t('Confirm release', '确认发布')}</button>}</> : <p className='mt-2 text-sm text-slate-600'>{t('A course lead must publish this result.', '此成绩需要课程负责人发布。')}</p>}</section>}
      </div>
    </div>}
  </main>;
}
