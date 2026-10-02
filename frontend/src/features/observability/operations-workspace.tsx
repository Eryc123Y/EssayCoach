'use client';

import { localized } from '@/locales';

import { useCallback, useEffect, useState } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { IconActivity, IconCircleCheck, IconCircleX, IconRefresh } from '@tabler/icons-react';
import {
  observabilityService,
  type OperationsOverview,
  type OperationsTrace,
} from '@/service/api/v2/observability';

export function OperationsWorkspace() {
  const { locale: language, applyLocale: setLanguage } = usePreferences();
  const [overview, setOverview] = useState<OperationsOverview>();
  const [traces, setTraces] = useState<OperationsTrace[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState<Date>();
  const t = (en: string, zh?: string) => localized(language, en, zh);
  const formatDateTime = (value: string | Date) => new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(value));
  const formatTime = (value: string | Date) => new Intl.DateTimeFormat(language === 'zh' ? 'zh-CN' : 'en-US', {
    timeStyle: 'medium',
  }).format(new Date(value));

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
        <h1 className='mt-3 text-4xl font-semibold tracking-tight'>{t('ui.systemActivity')}</h1>
        <p className='mt-3 max-w-2xl text-slate-600 dark:text-slate-300'>{t('ui.liveServiceHealthAiWorkAndRedactedTracesUpdatesEvery')}</p>
      </div>
      <div className='flex gap-2'>
        <button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'>{language === 'en' ? '中文' : 'English'}</button>
        <button type='button' onClick={() => { setBusy(true); void refresh(selectedJob); }} className='inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950'><IconRefresh size={17} className={busy ? 'animate-spin' : ''} />{t('ui.refresh')}</button>
      </div>
    </header>

    {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>{error}</p>}
    {!overview && busy && <p className='text-sm text-slate-500'>{t('ui.loadingActivity')}</p>}

    {overview && <>
      <section className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4' aria-label={t('ui.serviceHealth')}>
        <StatusCard label={t('ui.database')} healthy={overview.database_ok} t={t} />
        <StatusCard label={t('ui.aiWorker')} healthy={overview.worker_ok} t={t} detail={overview.worker_last_seen_at ? `${t('ui.lastSeen')} ${formatTime(overview.worker_last_seen_at)}` : t('ui.noHeartbeat')} />
        <CodexRuntimeCard loginStatus={overview.codex_login_status} t={t} />
        <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <p className='text-xs font-bold uppercase tracking-widest text-slate-500'>{t('ui.jobsProcessed')}</p>
          <p className='mt-4 text-3xl font-semibold'>{overview.worker_processed_jobs}</p>
          <p className='mt-2 text-xs text-slate-500'>{updatedAt && `${t('ui.updated')} ${formatTime(updatedAt)}`}</p>
        </div>
      </section>

      <section className='grid gap-4 sm:grid-cols-3' aria-label={t('ui.aiWorkloads')}>
        {(['formal', 'practice', 'chat'] as const).map((kind) => <div key={kind} className='rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900'>
          <div className='flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300'><IconActivity size={17} />{kind === 'formal' ? t('ui.formalScoring') : kind === 'practice' ? t('ui.practiceFeedback') : t('ui.coachChat')}</div>
          <p className='mt-3 text-3xl font-semibold'>{total(kind)}</p>
          <p className='mt-2 text-xs text-slate-500'>{Object.entries(overview.counts[kind]).map(([status, count]) => `${jobStatusLabel(status, t)} ${count}`).join(' · ') || t('ui.noJobsYet')}</p>
        </div>)}
      </section>

      <div className='grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]'>
        <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <div className='border-b border-slate-200 p-5 dark:border-slate-700'><h2 className='text-lg font-semibold'>{t('ui.recentAiJobs')}</h2><p className='mt-1 text-sm text-slate-500'>{t('ui.selectAJobToInspectItsTrace')}</p></div>
          {overview.jobs.length ? <ul tabIndex={0} aria-label={t('ui.recentAiJobs')} className='max-h-[34rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800'>
            {overview.jobs.map((job) => <li key={`${job.kind}-${job.id}`}><button type='button' onClick={() => setSelectedJob(selectedJob === job.id ? '' : job.id)} className={`grid w-full gap-2 p-4 text-left hover:bg-teal-50 dark:hover:bg-slate-800 sm:grid-cols-[1fr_auto] ${selectedJob === job.id ? 'bg-teal-50 dark:bg-slate-800' : ''}`}>
              <span className='min-w-0'><strong className='block text-sm'>{jobKindLabel(job.kind, t)} · {jobStatusLabel(job.status, t)}</strong><small className='mt-1 block truncate font-mono text-xs text-slate-500'>{job.id}</small><small className='mt-1 block text-xs text-slate-500'>{job.model} · {t('ui.attempt')} {job.attempts}{job.error_category ? ` · ${jobErrorLabel(job.error_category, t)}` : ''}</small></span>
              <time className='text-xs text-slate-500'>{formatDateTime(job.created_at)}</time>
            </button></li>)}
          </ul> : <p className='p-5 text-sm text-slate-500'>{t('ui.noAiJobsYet')}</p>}
        </section>

        <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'>
          <div className='flex items-center justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-700'><div><h2 className='text-lg font-semibold'>{t('ui.traceTimeline')}</h2><p className='mt-1 text-sm text-slate-500'>{selectedJob ? t('ui.filteredToSelectedJob') : t('ui.latestRequestsAndJobs')}</p></div>{selectedJob && <button type='button' onClick={() => setSelectedJob('')} className='text-sm font-semibold text-teal-700 dark:text-teal-300'>{t('ui.clear')}</button>}</div>
          {traces.length ? <ul tabIndex={0} aria-label={t('ui.traceTimeline')} className='max-h-[34rem] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800'>{traces.map((span) => <li key={`${span.trace_id}-${span.span_id}`} className='p-4'><div className='flex items-center justify-between gap-3'><strong className='text-sm'>{span.name}</strong><span className='font-mono text-xs text-slate-500'>{span.duration_ms} ms</span></div><p className='mt-2 text-xs text-slate-500'>{formatDateTime(span.started_at)} · {traceStatusLabel(span.status, t)}</p><p className='mt-1 truncate font-mono text-[11px] text-slate-500'>{span.trace_id}</p><div className='mt-2 flex flex-wrap gap-1'>{Object.entries(span.attributes).map(([key, value]) => <span key={key} className='rounded-md bg-slate-100 px-2 py-1 font-mono text-[11px] dark:bg-slate-800'>{key}: {value}</span>)}</div></li>)}</ul> : <p className='p-5 text-sm text-slate-500'>{t('ui.noTracesAvailableYet')}</p>}
        </section>
      </div>
    </>}
  </main>;
}

function CodexRuntimeCard({ loginStatus, t }: { loginStatus: OperationsOverview['codex_login_status']; t: (id: string) => string }) {
  const details = {
    valid: [true, t('ui.codexLoginValid')],
    not_logged_in: [false, t('ui.codexLoginRequired')],
    runtime_unavailable: [false, t('ui.codexRuntimeUnavailable')],
    unknown_timeout: [false, t('ui.codexLoginTimedOut')],
    unknown_error: [false, t('ui.codexLoginCheckFailed')],
  } as const;
  const [healthy, detail] = details[loginStatus];
  return <StatusCard label={t('ui.codexRuntime')} healthy={healthy} detail={detail} t={t} />;
}

function jobKindLabel(kind: string, t: (id: string) => string) {
  const labels: Record<string, string> = { formal: 'ui.jobKindFormal', practice: 'ui.jobKindPractice', chat: 'ui.jobKindChat' };
  return t(labels[kind] ?? 'ui.unknown');
}

function jobStatusLabel(status: string, t: (id: string) => string) {
  const labels: Record<string, string> = { pending: 'ui.jobStatusPending', running: 'ui.jobStatusRunning', succeeded: 'ui.jobStatusSucceeded', failed: 'ui.jobStatusFailed' };
  return t(labels[status] ?? 'ui.unknown');
}

function jobErrorLabel(category: string, t: (id: string) => string) {
  const labels: Record<string, string> = {
    runtime_unavailable: 'ui.jobErrorRuntimeUnavailable', subscription_login: 'ui.jobErrorSubscriptionLogin', timeout: 'ui.jobErrorTimeout',
    model_output: 'ui.jobErrorModelOutput', source_retrieval: 'ui.jobErrorSourceRetrieval', validation: 'ui.jobErrorValidation',
    provider: 'ui.jobErrorProvider', lease_exhausted: 'ui.jobErrorLeaseExhausted',
  };
  return t(labels[category] ?? 'ui.unknown');
}

function traceStatusLabel(status: string, t: (id: string) => string) {
  const labels: Record<string, string> = { UNSET: 'ui.traceStatusUnset', OK: 'ui.traceStatusOk', ERROR: 'ui.traceStatusError' };
  return t(labels[status] ?? 'ui.unknown');
}

function StatusCard({ label, healthy, detail, t }: { label: string; healthy: boolean; detail?: string; t: (en: string, zh?: string) => string }) {
  return <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
    <p className='text-xs font-bold uppercase tracking-widest text-slate-500'>{label}</p>
    <div className='mt-4 flex items-center gap-2'>{healthy ? <IconCircleCheck className='text-teal-600' size={27} /> : <IconCircleX className='text-amber-600' size={27} />}<strong className='text-lg'>{healthy ? t('ui.healthy') : t('ui.needsAttention')}</strong></div>
    <p className='mt-2 text-xs text-slate-500'>{detail || '\u00a0'}</p>
  </div>;
}
