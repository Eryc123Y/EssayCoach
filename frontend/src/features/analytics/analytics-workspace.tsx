'use client';

import { localized } from '@/locales';

import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { IconArrowLeft, IconChartBar, IconDownload, IconRefresh } from '@tabler/icons-react';
import { authService } from '@/service/api/v2/auth';
import { usePreferences } from '@/components/layout/preference-provider';
import { classService } from '@/service/api/v2/classes';
import {
  analyticsService,
  type AnalyticsFilter,
  type AnalyticsScope,
  type ClassAnalytics,
  type InstitutionAnalytics,
  type ScorePoint,
  type StudentAnalytics,
} from '@/service/api/v2/analytics';
import type { ClassItem } from '@/service/api/v2/types';

type Role = 'student' | 'lecturer' | 'admin';
type Report = StudentAnalytics | ClassAnalytics | InstitutionAnalytics;

export function AnalyticsWorkspace({ role }: { role: Role }) {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState<number>();
  const [studentId, setStudentId] = useState<number>();
  const [ownId, setOwnId] = useState<number>();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loaded, setLoaded] = useState<{ scope: AnalyticsScope; targetId?: number; data: Report }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const t = (en: string, zh?: string) => localized(language, en, zh);
  const scope: AnalyticsScope = studentId || role === 'student' ? 'student' : role === 'admin' && !classId ? 'institution' : 'class';
  const targetId = scope === 'student' ? (studentId || ownId) : classId;
  const report = loaded?.scope === scope && loaded.targetId === targetId ? loaded.data : undefined;
  const filters: AnalyticsFilter = { start_date: startDate || undefined, end_date: endDate || undefined };

  useEffect(() => {
    if (role === 'student') {
      authService.getUserInfo().then((user) => setOwnId(user.user_id)).catch((cause) => setError(String(cause)));
    } else {
      classService.listClasses().then((items) => {
        setClasses(items);
        if (role === 'lecturer' && items.length) setClassId(items[0].class_id);
      }).catch((cause) => setError(String(cause)));
    }
  }, [role]);

  useEffect(() => {
    if (scope !== 'institution' && !targetId) return;
    if (startDate && endDate && startDate > endDate) {
      setError(t('ui.startDateMustBeBeforeEndDate'));
      return;
    }
    let active = true;
    setBusy(true);
    setLoaded(undefined);
    const load = scope === 'student'
      ? analyticsService.student(targetId!, filters)
      : scope === 'class'
        ? analyticsService.class(targetId!, filters)
        : analyticsService.institution(filters);
    load.then((data) => { if (active) { setLoaded({ scope, targetId, data }); setError(''); } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : String(cause)); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [scope, targetId, startDate, endDate]);

  async function download() {
    setBusy(true);
    try {
      const blob = await analyticsService.export(scope, targetId, filters);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `essaycoach-${scope}-analytics.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }

  return <main className='mx-auto max-w-7xl space-y-7 px-4 py-8 text-slate-900 dark:text-slate-100 sm:px-7 lg:px-10'>
    <header className='flex flex-wrap items-start justify-between gap-5'>
      <div>
        <p className='text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / INSIGHTS</p>
        <h1 className='mt-3 text-4xl font-semibold tracking-tight'>{t('ui.writingProgress')}</h1>
        <p className='mt-3 max-w-2xl text-slate-600 dark:text-slate-300'>{t('ui.releasedAssessmentResultsAndThePatternsBehindThem')}</p>
      </div>
      <div className='flex flex-wrap gap-2'>
        <button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'>{language === 'en' ? '中文' : 'English'}</button>
        <button type='button' disabled={!report || busy} onClick={download} className='inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50'><IconDownload size={17} />{t('ui.exportCsv')}</button>
      </div>
    </header>

    <div className='flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
      {role !== 'student' && <label className='grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300'>{t('ui.class')}
        <select value={classId ?? ''} onChange={(event) => { setStudentId(undefined); setClassId(event.target.value ? Number(event.target.value) : undefined); }} className='min-w-48 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'>
          {role === 'admin' && <option value=''>{t('ui.institutionOverview')}</option>}
          {role === 'lecturer' && !classes.length && <option value=''>{t('ui.noClassesAssigned')}</option>}
          {classes.map((item) => <option key={item.class_id} value={item.class_id}>{item.class_name}</option>)}
        </select>
      </label>}
      <label className='grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300'>{t('ui.from')}<input type='date' value={startDate} onChange={(event) => setStartDate(event.target.value)} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' /></label>
      <label className='grid gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300'>{t('ui.to')}<input type='date' value={endDate} onChange={(event) => setEndDate(event.target.value)} className='rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' /></label>
      {(startDate || endDate) && <button type='button' onClick={() => { setStartDate(''); setEndDate(''); }} className='rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 dark:text-teal-300'>{t('ui.clearDates')}</button>}
    </div>

    {studentId && role !== 'student' && <button type='button' onClick={() => setStudentId(undefined)} className='inline-flex items-center gap-2 text-sm font-semibold text-teal-800 dark:text-teal-300'><IconArrowLeft size={17} />{t('ui.backToClass')}</button>}
    {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>{error}</p>}
    {busy && !report && <p className='inline-flex items-center gap-2 text-sm text-slate-500'><IconRefresh className='animate-spin' size={16} />{t('ui.loadingResults')}</p>}
    {!busy && role === 'lecturer' && !classId && <Empty text={t('ui.youHaveNoAssignedClassesYet')} />}
    {report && scope === 'student' && <StudentView data={report as StudentAnalytics} t={t} />}
    {report && scope === 'class' && <ClassView data={report as ClassAnalytics} t={t} onStudent={setStudentId} />}
    {report && scope === 'institution' && <InstitutionView data={report as InstitutionAnalytics} t={t} onClass={setClassId} />}
  </main>;
}

type Translate = (en: string, zh?: string) => string;
function Stat({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <div className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'><p className='text-sm text-slate-500 dark:text-slate-300'>{label}</p><p className='mt-3 text-3xl font-semibold tracking-tight'>{value}</p>{detail && <p className='mt-1 text-xs text-slate-500'>{detail}</p>}</div>;
}
function percent(value: number | null) { return value === null ? '—' : `${Math.round(value)}%`; }
function Empty({ text }: { text: string }) { return <div className='rounded-2xl border border-dashed border-slate-300 px-5 py-12 text-center text-slate-500 dark:border-slate-700'>{text}</div>; }
function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <section className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900'><h2 className='text-lg font-semibold'>{title}</h2><div className='mt-5'>{children}</div></section>; }

function Trend({ points, t }: { points: ScorePoint[]; t: Translate }) {
  if (!points.length) return <Empty text={t('ui.noReleasedResultsInThisPeriod')} />;
  return <div className='h-64 w-full' role='img' aria-label={t('ui.averageScoreByReleaseDate')}><ResponsiveContainer width='100%' height='100%'><AreaChart data={points} margin={{ top: 10, right: 18, bottom: 4, left: -15 }}><defs><linearGradient id='scoreFill' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stopColor='#0f766e' stopOpacity={0.25} /><stop offset='100%' stopColor='#0f766e' stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray='3 3' stroke='#cbd5e1' opacity={0.45} /><XAxis dataKey='date' tick={{ fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 11 }} /><Tooltip /><Area dataKey='average_score' type='monotone' stroke='#0f766e' strokeWidth={3} fill='url(#scoreFill)' /></AreaChart></ResponsiveContainer></div>;
}

function StudentView({ data, t }: { data: StudentAnalytics; t: Translate }) {
  return <div className='space-y-6'>
    <div className='grid gap-4 sm:grid-cols-3'><Stat label={t('ui.myAverage')} value={percent(data.average_score)} /><Stat label={t('ui.classAverage')} value={percent(data.class_average)} /><Stat label={t('ui.releasedResults')} value={data.published_results} detail={`${data.total_submissions} ${t('ui.submissions')}`} /></div>
    <Panel title={t('ui.progressOverTime')}><Trend points={data.trend} t={t} /></Panel>
    <div className='grid gap-6 lg:grid-cols-2'><Panel title={t('ui.writingCriteria')}>{data.criteria.length ? <div className='space-y-4'>{data.criteria.map((item) => <div key={item.criterion}><div className='flex justify-between text-sm'><span>{item.criterion}</span><strong>{percent(item.average_percent)}</strong></div><div className='mt-2 h-2 rounded-full bg-slate-100 dark:bg-slate-700'><div className='h-2 rounded-full bg-teal-500' style={{ width: `${item.average_percent}%` }} /></div></div>)}</div> : <Empty text={t('ui.noCriterionScoresYet')} />}</Panel><Panel title={t('ui.focusNext')}>{data.recommendations.length ? <ul className='space-y-3'>{data.recommendations.map((item) => <li key={item.criterion} className='rounded-xl bg-teal-50 p-3 text-sm text-teal-950 dark:bg-teal-950 dark:text-teal-100'><strong>{item.criterion}</strong><span className='ml-2'>{t('ui.isYourLowestScoringCriterionReviewTheTeacherFeedbackAnd')}</span></li>)}</ul> : <Empty text={t('ui.recommendationsAppearAfterGradesAreReleased')} />}</Panel></div>
    <Panel title={t('ui.releasedScoreHistory')}>{data.score_history.length ? <div className='space-y-2'>{data.score_history.map((item) => <a key={item.submission_id} href={`/dashboard/submissions/${item.submission_id}`} className='flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm hover:border-teal-400 dark:border-slate-700'><span>{item.task_title}<small className='block text-slate-500'>{new Date(item.published_at).toLocaleDateString()}</small></span><strong>{percent(item.score)}</strong></a>)}</div> : <Empty text={t('ui.noGradesHaveBeenReleasedYet')} />}</Panel>
  </div>;
}

function ClassView({ data, t, onStudent }: { data: ClassAnalytics; t: Translate; onStudent: (id: number) => void }) {
  const [studentSort, setStudentSort] = useState<'name' | 'score' | 'submissions'>('name');
  const sortedStudents = [...data.students].sort((a, b) => studentSort === 'name'
    ? a.name.localeCompare(b.name)
    : studentSort === 'score' ? (b.average_score ?? -1) - (a.average_score ?? -1)
      : b.submissions - a.submissions);
  return <div className='space-y-6'><div className='flex items-center gap-2 text-sm text-teal-800 dark:text-teal-300'><IconChartBar size={18} /><span>{data.unit_id} / {data.class_name}</span></div>
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'><Stat label={t('ui.averageScore')} value={percent(data.average_score)} /><Stat label={t('ui.completionRate')} value={percent(data.completion_rate)} /><Stat label={t('ui.submissionsc2250a')} value={data.submission_count} /><Stat label={t('ui.releasedGrades')} value={data.published_count} /><Stat label={t('ui.successfulLogins')} value={data.login_count} detail={`${data.login_users} ${t('ui.people')}`} /></div>
    <div className='grid gap-6 lg:grid-cols-2'><Panel title={t('ui.scoreDistribution')}><div className='h-64 w-full'><ResponsiveContainer width='100%' height='100%'><BarChart data={data.distribution} margin={{ left: -18, right: 10 }}><CartesianGrid strokeDasharray='3 3' vertical={false} /><XAxis dataKey='range' tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey='count' fill='#0f766e' radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel><Panel title={t('ui.progressOverTime')}><Trend points={data.trend} t={t} /></Panel></div>
    <Panel title={t('ui.studentPerformance')}><label className='mb-4 flex items-center gap-2 text-sm text-slate-600'>{t('ui.sortBy')}<select aria-label={t('ui.sortStudents')} value={studentSort} onChange={event => setStudentSort(event.target.value as typeof studentSort)} className='rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900'><option value='name'>{t('ui.name')}</option><option value='score'>{t('ui.averageScore')}</option><option value='submissions'>{t('ui.submissionsc2250a')}</option></select></label>{data.students.length ? <div className='space-y-2'>{sortedStudents.map((item) => <button type='button' key={item.user_id} onClick={() => onStudent(item.user_id)} className='flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:border-teal-400 dark:border-slate-700'><span><strong className='block'>{item.name}</strong><small className='text-slate-500'>{item.submissions} {t('ui.submissions')} · {item.published_results} {t('ui.released')}</small></span><strong>{percent(item.average_score)}</strong></button>)}</div> : <Empty text={t('ui.noStudentsEnrolled')} />}</Panel>
    <div className='grid gap-6 lg:grid-cols-2'><Panel title={t('ui.tasks')}><div className='space-y-2'>{data.tasks.map((item) => <div key={item.task_id} className='flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800'><span>{item.title}</span><strong>{percent(item.average_score)}</strong></div>)}</div></Panel><Panel title={t('ui.commonWritingIssues')}>{data.criteria.length ? <div className='space-y-2'>{data.criteria.slice(0, 4).map((item) => <p key={item.criterion} className='flex justify-between rounded-xl bg-slate-50 px-4 py-3 text-sm dark:bg-slate-800'><span>{item.criterion}</span><strong>{percent(item.average_percent)}</strong></p>)}</div> : <Empty text={t('ui.noReleasedCriterionScoresYet')} />}</Panel></div>
  </div>;
}

function InstitutionView({ data, t, onClass }: { data: InstitutionAnalytics; t: Translate; onClass: (id: number) => void }) {
  const [classSort, setClassSort] = useState<'name' | 'score' | 'students'>('name');
  const sortedClasses = [...data.classes].sort((a, b) => classSort === 'name'
    ? a.class_name.localeCompare(b.class_name)
    : classSort === 'score' ? (b.average_score ?? -1) - (a.average_score ?? -1)
      : b.student_count - a.student_count);
  return <div className='space-y-6'><div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-5'><Stat label={t('ui.activePeople')} value={data.active_users} detail={`${data.active_students} ${t('ui.students')} · ${data.active_lecturers} ${t('ui.lecturers')}`} /><Stat label={t('ui.successfulLogins')} value={data.login_count} detail={`${data.login_users} ${t('ui.people')}`} /><Stat label={t('ui.activeClasses')} value={data.active_classes} /><Stat label={t('ui.submissionsc2250a')} value={data.submission_count} /><Stat label={t('ui.releasedGradeAverage')} value={percent(data.average_score)} /></div>
    <Panel title={t('ui.institutionScoreTrend')}><Trend points={data.trend} t={t} /></Panel>
    <div className='grid gap-6 lg:grid-cols-2'><Panel title={t('ui.classes')}><label className='mb-4 flex items-center gap-2 text-sm text-slate-600'>{t('ui.sortBy')}<select aria-label={t('ui.sortClasses')} value={classSort} onChange={event => setClassSort(event.target.value as typeof classSort)} className='rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900'><option value='name'>{t('ui.className')}</option><option value='score'>{t('ui.averageScore')}</option><option value='students'>{t('ui.studentCount')}</option></select></label>{data.classes.length ? <div className='space-y-2'>{sortedClasses.map((item) => <button type='button' key={item.class_id} onClick={() => onClass(item.class_id)} className='flex w-full justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:border-teal-400 dark:border-slate-700'><span>{item.unit_id} · {item.class_name}<small className='block text-slate-500'>{item.student_count} {t('ui.students')}</small></span><strong>{percent(item.average_score)}</strong></button>)}</div> : <Empty text={t('ui.noActiveClasses')} />}</Panel><Panel title={t('ui.operationalActivity')}><div className='space-y-3 text-sm'><p className='flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800'><span>{t('ui.publishedGrades')}</span><strong>{data.published_count}</strong></p><p className='flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800'><span>{t('ui.teacherReviews')}</span><strong>{data.lecturer_activity.reduce((sum, item) => sum + item.reviews, 0)}</strong></p>{Object.entries(data.ai_jobs).map(([status, count]) => <p key={status} className='flex justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800'><span>AI · {status}</span><strong>{count}</strong></p>)}</div></Panel></div>
  </div>;
}
