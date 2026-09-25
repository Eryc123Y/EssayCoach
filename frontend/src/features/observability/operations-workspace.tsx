'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { IconActivity, IconCircleCheck, IconCircleX, IconRefresh } from '@tabler/icons-react';
import {
  observabilityService,
  type OperationsOverview,
  type OperationsTrace,
} from '@/service/api/v2/observability';

export function OperationsWorkspace() {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [overview, setOverview] = useState<OperationsOverview>();
  const [traces, setTraces] = useState<OperationsTrace[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const t = (en: string, zh: string) => language === 'zh' ? zh : en;

  const refresh = useCallback(async (jobId = '') => {
    try {
      const [nextOverview, nextTraces] = await Promise.all([
        observabilityService.overview(), observabilityService.traces(jobId),
      ]);
      setOverview(nextOverview);
      setTraces(nextTraces);
      setUpdatedAt(new Date());
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh(selectedJob);
    const timer = window.setInterval(() => { void refresh(selectedJob); }, 10000);
    return () => window.clearInterval(timer);
  }, [refresh, selectedJob]);

  const total = (kind: 'formal' | 'practice' | 'chat') =>
    Object.values(overview?.counts[kind] ?? {}).reduce((sum, count) => sum + count, 0);

  return <main className='mx-auto max-w-7xl space-y-7 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-7 lg:px-10'>
    <header className='flex flex-wrap items-start justify-between gap-5'>
      <div>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / OPERATIONS</p>
        <h1 className='mt-3 text-4xl font-semibold tracking-tight'>{t('System activity', '系统运行')}</h1>
        <p className='mt-3 max-w-2xl text-slate-600 dark:text-slate-300'>{t('Live service health, AI work, and redacted traces. Updates every 10 seconds.', '查看服务状态、AI 任务与脱敏追踪，每 10 秒更新。')}</p>
      </div>
      <div className='flex gap-2'>
        <button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'>{language === 'en' ? '中文' : 'English'}</button>
        <button type='button' onClick={() => { setBusy(true); void refresh(selectedJob); }} className='inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950'><IconRefresh size={17} className={busy ? 'animate-spin' : ''} />{t('Refresh', '刷新')}</button>
      </div>
    </header>

    {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>{error}</p>}
    {!overview && busy && <p className='text-sm text-slate-500'>{t('Loading activity…', '正在加载运行状态…')}</p>}

    {overview && <>
      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4' aria-label={t('Service health', '服务状态')}>
        <StatusCard label={t('Database', '数据库')} healthy={overview.database_ok} t={t} />
        <StatusCard label={t('AI worker', 'AI 工作进程')} healthy={overview.worker_ok} t={t} detail={overview.worker_last_seen_at ? `${t('Last seen', '上次心跳')} ${new Date(overview.worker_last_seen_at).toLocaleTimeString()}` : t('No heartbeat', '尚无心跳')} />
        <StatusCard label={t('Codex runtime', 'Codex 运行环境')} healthy={overview.codex_binary_found} t={t} />
        <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <p className='text-xs font-bold uppercase tracking-widest text-slate-500'>{t('Jobs processed', '已处理任务')}</p>
          <p className='mt-4 text-3xl font-semibold'>{overview.worker_processed_jobs}</p>
          <p className='mt-2 text-xs text-slate-500'>{updatedAt && `${t('Updated', '更新于')} ${updatedAt.toLocaleTimeString()}`}</p>
        </div>
      </section>

      <section className='grid gap-4 sm:grid-cols-3' aria-label={t('AI workloads', 'AI 任务')}>
        {(['formal', 'practice', 'chat'] as const).map((kind) => <div key={kind} className='rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900'>
          <div className='flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300'><IconActivity size={17} />{kind === 'formal' ? t('Formal scoring', '正式评分') : kind === 'practice' ? t('Practice feedback', '练习反馈') : t('Coach chat', '辅导对话')}</div>
          <p className='mt-3 text-3xl font-semibold'>{total(kind)}</p>
          <p className='mt-2 text-xs text-slate-500'>{Object.entries(overview.counts[kind]).map(([status, count]) => `${status} ${count}`).join(' · ') || t('No jobs yet', '暂无任务')}</p>
        </div>)}
      </section>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'>
        <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <div className='border-b border-slate-200 p-5 dark:border-slate-700'><h2 className='text-lg font-semibold'>{t('Recent AI jobs', '最近的 AI 任务')}</h2><p className='mt-1 text-sm text-slate-500'>{t('Select a job to inspect its trace.', '选择任务查看追踪。')}</p></div>
          {overview.jobs.length ? <ul className='max-h-[34rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800'>
            {overview.jobs.map((job) => <li key={`${job.kind}-${job.id}`}><button type='button' onClick={() => setSelectedJob(selectedJob === job.id ? '' : job.id)} className={`grid w-full gap-2 p-4 text-left hover:bg-teal-50 dark:hover:bg-slate-800 sm:grid-cols-[1fr_auto] ${selectedJob === job.id ? 'bg-teal-50 dark:bg-slate-800' : ''}`}>
              <span className='min-w-0'><strong className='block text-sm capitalize'>{job.kind} · {job.status}</strong><small className='mt-1 block truncate font-mono text-xs text-slate-500'>{job.id}</small><small className='mt-1 block text-xs text-slate-500'>{job.model} · {t('attempt', '尝试')} {job.attempts}{job.error_category ? ` · ${job.error_category}` : ''}</small></span>
              <time className='text-xs text-slate-500'>{new Date(job.created_at).toLocaleString()}</time>
            </button></li>)}
          </ul> : <p className='p-5 text-sm text-slate-500'>{t('No AI jobs yet.', '暂无 AI 任务。')}</p>}
        </section>

        <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <div className='flex items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-700'><div><h2 className='text-lg font-semibold'>{t('Trace timeline', '追踪时间线')}</h2><p className='mt-1 text-sm text-slate-500'>{selectedJob ? t('Filtered to selected job', '仅显示所选任务') : t('Latest requests and jobs', '最近的请求与任务')}</p></div>{selectedJob && <button type='button' onClick={() => setSelectedJob('')} className='text-sm font-semibold text-teal-700 dark:text-teal-300'>{t('Clear', '清除')}</button>}</div>
          {traces.length ? <ul className='max-h-[34rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800'>{traces.map((span) => <li key={`${span.trace_id}-${span.span_id}`} className='p-4'><div className='flex items-center justify-between gap-3'><strong className='text-sm'>{span.name}</strong><span className='font-mono text-xs text-slate-500'>{span.duration_ms} ms</span></div><p className='mt-2 text-xs text-slate-500'>{new Date(span.started_at).toLocaleString()} · {span.status}</p><p className='mt-1 truncate font-mono text-[11px] text-slate-500'>{span.trace_id}</p><div className='mt-2 flex flex-wrap gap-1'>{Object.entries(span.attributes).map(([key, value]) => <span key={key} className='rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] dark:bg-slate-800'>{key}: {value}</span>)}</div></li>)}</ul> : <p className='p-5 text-sm text-slate-500'>{t('No traces available yet.', '暂无追踪记录。')}</p>}
        </section>
      </div>
    </>}
  </main>;
}

function StatusCard({ label, healthy, detail, t }: { label: string; healthy: boolean; detail?: string; t: (en: string, zh: string) => string }) {
  return <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
    <p className='text-xs font-bold uppercase tracking-widest text-slate-500'>{label}</p>
    <div className='mt-4 flex items-center gap-2'>{healthy ? <IconCircleCheck className='text-teal-600' size={27} /> : <IconCircleX className='text-amber-600' size={27} />}<strong className='text-lg'>{healthy ? t('Healthy', '正常') : t('Needs attention', '需要检查')}</strong></div>
    <p className='mt-2 text-xs text-slate-500'>{detail || '\u00a0'}</p>
  </div>;
}
