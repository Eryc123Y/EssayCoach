'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, Copy, Globe2, LockKeyhole, Scale } from 'lucide-react';
import { useAuth } from '@/components/layout/simple-auth-context';
import { usePreferences } from '@/components/layout/preference-provider';
import { Button } from '@/components/ui/button';
import { fetchRubricDetail, type RubricDetail } from '@/service/api/rubric';

export default function RubricDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rubricId = Number(params.id);
  const { user } = useAuth();
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const [rubric, setRubric] = useState<RubricDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    fetchRubricDetail(rubricId).then((detail) => { if (active) setRubric(detail); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [rubricId]);

  const totalWeight = useMemo(() => rubric?.rubric_items.reduce((sum, item) => sum + Number(item.rubric_item_weight || 0), 0) ?? 0, [rubric]);
  const levelCount = useMemo(() => rubric?.rubric_items.reduce((sum, item) => sum + item.level_descriptions.length, 0) ?? 0, [rubric]);
  const canRevise = rubric && user && (user.role === 'admin' || Number(user.id) === rubric.user_id_user);

  if (loading) return <main className='mx-auto max-w-6xl p-8 text-sm text-slate-500'>{t('Loading rubric…', '正在加载量规…')}</main>;
  if (error || !rubric) return <main className='mx-auto max-w-6xl p-8'>
    <h1 className='text-2xl font-semibold'>{t('Rubric unavailable', '无法查看量规')}</h1>
    <p className='mt-2 text-sm text-slate-500'>{t('It may be private or no longer available.', '此量规可能是私人量规，或已被删除。')}</p>
    <Button variant='outline' className='mt-5' onClick={() => router.push('/dashboard/rubrics')}><ArrowLeft size={16} /> {t('Back to library', '返回量规库')}</Button>
  </main>;

  return <main className='mx-auto max-w-6xl px-4 py-7 md:px-9 md:py-10'>
    <button type='button' onClick={() => router.push('/dashboard/rubrics')} className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 dark:text-slate-300'><ArrowLeft size={16} /> {t('Rubric library', '返回量规库')}</button>
    <header className='border-b-4 border-indigo-500 bg-[#111b35] p-6 text-white md:p-9'>
      <div className='mb-4 flex items-center gap-2 text-sm font-medium text-indigo-200'><BookOpen size={16} /> {t('Scoring guide', '评分指南')}</div>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='min-w-0'><h1 className='break-words text-3xl font-semibold tracking-tight md:text-4xl'>{rubric.rubric_desc}</h1><p className='mt-2 text-sm text-slate-300'>{t('Created', '创建于')} {new Date(rubric.rubric_create_time).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
        <span className='inline-flex items-center gap-2 border border-slate-500 px-3 py-1.5 text-xs font-semibold text-slate-100'>{rubric.visibility === 'public' ? <Globe2 size={14} /> : <LockKeyhole size={14} />}{rubric.visibility === 'public' ? t('Shared with institution', '机构内公开') : t('Private', '私人')}</span>
      </div>
      {canRevise && <Button className='mt-6 border-slate-500 bg-transparent text-white hover:bg-white hover:text-[#111b35]' variant='outline' onClick={() => router.push(`/dashboard/rubrics/new?from=${rubric.rubric_id}`)}><Copy size={16} /> {t('Create revised copy', '创建修订副本')}</Button>}
    </header>

    <div className='grid grid-cols-3 divide-x divide-stone-200 border-b border-stone-200 py-5 dark:divide-slate-700 dark:border-slate-700'>
      <Summary value={rubric.rubric_items.length} label={t('Criteria', '评分维度')} />
      <Summary value={levelCount} label={t('Score levels', '分数等级')} />
      <Summary value={`${totalWeight.toFixed(1)}%`} label={t('Total weight', '权重合计')} />
    </div>

    <div className='mt-9 flex items-center gap-3'><span className='flex h-9 w-9 items-center justify-center bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'><Scale size={18} /></span><div><h2 className='text-xl font-semibold'>{t('Criteria and expectations', '评分维度与要求')}</h2><p className='text-sm text-slate-500'>{t('Read each range to understand what stronger work looks like.', '查看各分数区间，了解更好的写作表现。')}</p></div></div>
    <div className='mt-5 space-y-5'>
      {rubric.rubric_items.length === 0 && <div className='rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-slate-500'>{t('No criteria have been added yet.', '此量规尚未添加评分维度。')}</div>}
      {rubric.rubric_items.map((item) => <section key={item.rubric_item_id} className='overflow-hidden border-l-4 border-indigo-500 bg-white dark:bg-slate-900'>
        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-5 md:px-7 dark:border-slate-800'><h3 className='break-words text-lg font-semibold'>{item.rubric_item_name}</h3><span className='bg-stone-100 px-3 py-1 text-sm font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200'>{item.rubric_item_weight}%</span></div>
        <div className='divide-y divide-stone-100 px-5 dark:divide-slate-800 md:px-7'>
          {[...item.level_descriptions].sort((a, b) => b.level_max_score - a.level_max_score).map((level) => <div key={level.level_desc_id} className='grid gap-2 py-4 sm:grid-cols-[100px_1fr] sm:gap-5'><span className='w-fit self-start bg-indigo-50 px-2.5 py-1 text-sm font-bold tabular-nums text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200'>{level.level_min_score}–{level.level_max_score} {t('pts', '分')}</span><p className='whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200'>{level.level_desc}</p></div>)}
          {item.level_descriptions.length === 0 && <p className='py-5 text-sm text-slate-500'>{t('No score levels defined.', '尚无分数等级。')}</p>}
        </div>
        {item.exemplar_text && <div className='border-t border-stone-100 bg-emerald-50/50 px-5 py-5 md:px-7 dark:border-slate-800 dark:bg-emerald-950/20'><p className='mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300'>{t('High-scoring exemplar', '高分范例')}</p><p className='whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200'>{item.exemplar_text}</p></div>}
      </section>)}
    </div>
    <p className='mt-7 text-xs leading-5 text-slate-500'>{t('Assignment scores use the rubric snapshot saved when the task was published. Revising this guide creates a new rubric.', '作业成绩依据发布时保存的量规快照；修订本指南会创建新的量规。')}</p>
  </main>;
}

function Summary({ value, label }: { value: number | string; label: string }) {
  return <div className='px-3 text-center first:pl-0 last:pr-0 sm:px-5'><div className='text-xl font-semibold tabular-nums text-slate-950 sm:text-2xl dark:text-white'>{value}</div><div className='mt-1 text-[11px] font-medium text-slate-500 sm:text-xs'>{label}</div></div>;
}
