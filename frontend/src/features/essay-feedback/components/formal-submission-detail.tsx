'use client';

import { localized } from '@/locales';

import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock3, FileText } from 'lucide-react';
import { usePreferences } from '@/components/layout/preference-provider';

type Submission = {
  submission_id: number;
  submission_time: string;
  task_id_task: number;
  submission_txt: string;
};

type Assessment = {
  status: string;
  final_score: string | null;
  published_at: string | null;
  items: Array<{ rubric_item_id: number; score: number; comment: string }>;
  rubric_snapshot: Array<{ id: number; name: string; max_score: number }> | null;
};

export function FormalSubmissionDetail({
  submission, assessment
}: {
  submission: Submission;
  assessment: Assessment | null;
}) {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const t = (en: string, zh?: string) => localized(language, en, zh);
  const published = assessment?.status === 'published';
  const criteria = new Map(assessment?.rubric_snapshot?.map(item => [item.id, item]) ?? []);
  return (
    <main className='mx-auto max-w-5xl space-y-7 px-5 py-8 md:px-9'>
      <div className='flex items-center justify-between gap-4'>
        <Link href='/dashboard/student' className='inline-flex items-center gap-2 text-sm text-slate-600 hover:text-blue-700'>
          <ArrowLeft size={16} />{t('ui.backToDashboard')}
        </Link>
        <button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700'>
          {language === 'en' ? '中文' : 'EN'}
        </button>
      </div>

      <header className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'>
        <span className='text-xs font-semibold uppercase tracking-[.18em] text-blue-700'>{t('ui.formalSubmission')}</span>
        <h1 className='mt-3 text-3xl font-semibold tracking-tight text-slate-900'>{t('ui.yourSubmittedEssay')} <span className='text-slate-400'>#{submission.submission_id}</span></h1>
        <p className='mt-3 text-sm text-slate-500'>{t('ui.submittedf369a2')} {new Date(submission.submission_time).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US')}</p>
        <div className={`mt-6 flex items-start gap-3 rounded-2xl p-4 ${published ? 'bg-emerald-50 text-emerald-900' : 'bg-blue-50 text-blue-900'}`}>
          {published ? <CheckCircle2 className='mt-0.5 shrink-0' size={19} /> : <Clock3 className='mt-0.5 shrink-0' size={19} />}
          <div><strong>{published ? t('ui.resultPublished') : t('ui.awaitingTeacherReviewAndRelease')}</strong>
            <p className='mt-1 text-sm'>{published ? t('ui.yourCourseLeadHasConfirmedTheFinalResult') : t('ui.yourEssayIsSafelySubmittedAScoreWillAppearHere')}</p></div>
        </div>
        {published && <Link href='/dashboard/community' className='mt-4 inline-flex rounded-full border border-teal-300 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50'>{t('ui.shareWithYourLearningCommunity')}</Link>}
      </header>

      {published && assessment && <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'>
        <div className='flex items-end justify-between gap-4'><div><span className='text-xs font-semibold uppercase tracking-[.18em] text-blue-700'>{t('ui.teacherReviewedResult')}</span><h2 className='mt-2 text-2xl font-semibold text-slate-900'>{t('ui.finalAssessment')}</h2></div><div className='text-right'><strong className='text-4xl text-blue-700'>{assessment.final_score}</strong><span className='text-slate-500'> / 100</span></div></div>
        <div className='mt-6 divide-y divide-slate-100 border-t border-slate-100'>
          {assessment.items.map(item => <div key={item.rubric_item_id} className='grid gap-2 py-5 sm:grid-cols-[1fr_auto]'><div><h3 className='font-medium text-slate-900'>{criteria.get(item.rubric_item_id)?.name || t('ui.criterion')}</h3><p className='mt-1 text-sm leading-6 text-slate-600'>{item.comment || t('ui.noAdditionalComment')}</p></div><strong className='text-slate-900'>{item.score} / {criteria.get(item.rubric_item_id)?.max_score ?? '—'}</strong></div>)}
        </div>
      </section>}

      <section className='rounded-3xl border border-slate-200 bg-white p-7 shadow-sm md:p-9'>
        <h2 className='flex items-center gap-2 text-xl font-semibold text-slate-900'><FileText size={19} />{t('ui.submittedText')}</h2>
        <div className='mt-6 whitespace-pre-wrap font-serif text-base leading-8 text-slate-800'>{submission.submission_txt}</div>
      </section>
    </main>
  );
}
