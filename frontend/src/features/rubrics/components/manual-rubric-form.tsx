'use client';

import { localized } from '@/locales';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Scale, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/components/layout/preference-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { createManualRubric, fetchRubricDetail, type ManualRubricInput } from '@/service/api/rubric';

type Criterion = ManualRubricInput['items'][number];

const blankCriterion = (): Criterion => ({
  rubric_item_name: '', rubric_item_weight: '100', exemplar_text: '',
  levels: [
    { level_min_score: 0, level_max_score: 4, level_desc: '' },
    { level_min_score: 5, level_max_score: 10, level_desc: '' }
  ]
});

const field = 'w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-indigo-900';

export function ManualRubricForm({ canPublish }: { canPublish: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const sourceId = search.get('from');
  const { locale } = usePreferences();
  const localeAtLoad = useRef(locale);
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const [name, setName] = useState('');
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [items, setItems] = useState<Criterion[]>([blankCriterion()]);
  const [saving, setSaving] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.rubric_item_weight || 0), 0), [items]);

  useEffect(() => {
    if (!sourceId || !/^\d+$/.test(sourceId)) return;
    let active = true;
    setLoadingTemplate(true);
    fetchRubricDetail(Number(sourceId)).then((source) => {
      if (!active) return;
      setName(`${source.rubric_desc} · ${localeAtLoad.current === 'zh' ? '修订版' : 'revision'}`);
      setItems(source.rubric_items.map((item) => ({
        rubric_item_name: item.rubric_item_name,
        rubric_item_weight: item.rubric_item_weight,
        exemplar_text: item.exemplar_text || '',
        levels: item.level_descriptions.map((level) => ({
          level_min_score: level.level_min_score,
          level_max_score: level.level_max_score,
          level_desc: level.level_desc
        }))
      })));
    }).catch((error) => toast.error(error instanceof Error ? error.message : localeAtLoad.current === 'zh' ? '无法载入模板' : 'Could not load template'))
      .finally(() => { if (active) setLoadingTemplate(false); });
    return () => { active = false; };
  }, [sourceId]);

  const updateItem = (index: number, patch: Partial<Criterion>) => setItems((current) => current.map((item, at) => at === index ? { ...item, ...patch } : item));
  const updateLevel = (index: number, levelIndex: number, patch: Partial<Criterion['levels'][number]>) => {
    setItems((current) => current.map((item, at) => at === index ? {
      ...item, levels: item.levels.map((level, atLevel) => atLevel === levelIndex ? { ...level, ...patch } : level)
    } : item));
  };
  const moveItem = (index: number, direction: -1 | 1) => setItems((current) => {
    const next = [...current];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    return next;
  });

  const submit = async () => {
    if (!name.trim()) return toast.error(t('ui.addARubricName'));
    if (Math.abs(total - 100) > 0.001) return toast.error(t('ui.weightsMustTotal100'));
    if (items.some((item) => !item.rubric_item_name.trim() || !item.levels.length || item.levels.some((level) => !level.level_desc.trim()))) {
      return toast.error(t('ui.nameEveryCriterionAndDescribeEachScoreLevel'));
    }
    for (const item of items) {
      let expected = 0;
      for (const level of [...item.levels].sort((a, b) => a.level_min_score - b.level_min_score)) {
        if (level.level_min_score !== expected || level.level_max_score < level.level_min_score) {
          return toast.error(t('ui.scoreRangesMustBeginAt0WithoutGapsOrOverlaps'));
        }
        expected = level.level_max_score + 1;
      }
    }
    setSaving(true);
    try {
      const created = await createManualRubric({ rubric_desc: name.trim(), visibility, items });
      toast.success(t('ui.rubricCreated'));
      router.push(`/dashboard/rubrics/${created.rubric_id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('ui.couldNotCreateRubric'));
    } finally { setSaving(false); }
  };

  return <main className='mx-auto max-w-5xl px-4 py-7 md:px-9 md:py-10'>
    <button type='button' onClick={() => router.push('/dashboard/rubrics')} className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 dark:text-slate-300'>
      <ArrowLeft size={16} /> {t('ui.rubricLibrary')}
    </button>
    <header className='border-b-4 border-indigo-500 bg-[#111b35] p-6 text-white md:p-9'>
      <div className='mb-4 flex items-center gap-2 text-sm font-medium text-indigo-200'><Scale size={16} /> {t('ui.rubricWorkshop')}</div>
      <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>{sourceId ? t('ui.createARevisedCopy') : t('ui.buildARubric')}</h1>
      <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>{t('ui.defineCriteriaAndScoreRangesExistingAssignmentsRetainTh')}</p>
    </header>

    {loadingTemplate ? <p className='py-12 text-center text-slate-500'>{t('ui.loadingTemplate')}</p> : <div className='mt-7 space-y-6'>
      <section className='grid gap-5 border-b border-stone-200 bg-white p-5 md:grid-cols-[1fr_auto] md:p-7 dark:border-slate-800 dark:bg-slate-900'>
        <label className='space-y-2 text-sm font-medium'>{t('ui.rubricName83543f')}<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={t('ui.eGAcademicArgument')} className='mt-2' /></label>
        <label className='space-y-2 text-sm font-medium'>{t('ui.visibility')}<select value={visibility} onChange={(event) => setVisibility(event.target.value as 'private' | 'public')} className={`mt-2 ${field}`}>
          <option value='private'>{t('ui.private')}</option>{canPublish && <option value='public'>{t('ui.publicToInstitution')}</option>}
        </select></label>
      </section>

      <div className='flex flex-wrap items-end justify-between gap-3'><div><h2 className='text-xl font-semibold'>{t('ui.scoringCriteria')}</h2><p className='text-sm text-slate-500'>{t('ui.arrangeTheCriteriaInTheOrderStudentsShouldReadThem')}</p></div><div className={`rounded-full px-4 py-2 text-sm font-semibold ${Math.abs(total - 100) < 0.001 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{t('ui.totalWeight')} {total.toFixed(1)}%</div></div>
      {items.map((item, index) => <section key={index} className='border-l-4 border-indigo-500 bg-white p-5 md:p-7 dark:bg-slate-900'>
        <div className='mb-5 flex flex-wrap items-center justify-between gap-2'><h3 className='text-lg font-semibold'>{String(index + 1).padStart(2, '0')} / {t('ui.criteriond3a8ea')}</h3><div className='flex gap-1'>
          <Button type='button' variant='ghost' size='icon' disabled={index === 0} aria-label={t('ui.moveUp')} onClick={() => moveItem(index, -1)}><ArrowUp size={16} /></Button>
          <Button type='button' variant='ghost' size='icon' disabled={index === items.length - 1} aria-label={t('ui.moveDown')} onClick={() => moveItem(index, 1)}><ArrowDown size={16} /></Button>
          <Button type='button' variant='ghost' size='icon' disabled={items.length === 1} aria-label={t('ui.removeCriterion')} onClick={() => setItems((current) => current.filter((_, at) => at !== index))}><Trash2 size={16} /></Button>
        </div></div>
        <div className='grid gap-4 sm:grid-cols-[1fr_150px]'>
          <label className='text-sm font-medium'>{t('ui.name72219d')}<Input className='mt-2' value={item.rubric_item_name} maxLength={50} onChange={(event) => updateItem(index, { rubric_item_name: event.target.value })} /></label>
          <label className='text-sm font-medium'>{t('ui.weight')}<Input className='mt-2' type='number' min='0.1' max='100' step='0.1' value={item.rubric_item_weight} onChange={(event) => updateItem(index, { rubric_item_weight: event.target.value })} /></label>
        </div>
        <label className='mt-4 block text-sm font-medium'>{t('ui.highScoringExemplarOptional')}<Textarea className='mt-2 min-h-24' value={item.exemplar_text} onChange={(event) => updateItem(index, { exemplar_text: event.target.value })} placeholder={t('ui.aShortExampleOfStrongWritingForThisCriterion')} /></label>
        <div className='mt-6 space-y-3'><h4 className='text-sm font-semibold'>{t('ui.scoreLevels')}</h4>
          {item.levels.map((level, levelIndex) => <div key={levelIndex} className='grid gap-2 rounded-xl bg-stone-50 p-3 sm:grid-cols-[75px_75px_1fr_auto] dark:bg-slate-950'>
            <label className='text-xs text-slate-500'>{t('ui.fromfe1cc8')}<Input className='mt-1' type='number' min='0' max='100' value={level.level_min_score} onChange={(event) => updateLevel(index, levelIndex, { level_min_score: Number(event.target.value) })} /></label>
            <label className='text-xs text-slate-500'>{t('ui.toebc930')}<Input className='mt-1' type='number' min='0' max='100' value={level.level_max_score} onChange={(event) => updateLevel(index, levelIndex, { level_max_score: Number(event.target.value) })} /></label>
            <label className='text-xs text-slate-500'>{t('ui.descriptionc12acd')}<Input className='mt-1' value={level.level_desc} onChange={(event) => updateLevel(index, levelIndex, { level_desc: event.target.value })} /></label>
            <Button type='button' variant='ghost' size='icon' className='self-end' aria-label={`${t('ui.removeLevel')} ${level.level_min_score}–${level.level_max_score} · ${item.rubric_item_name || `${index + 1}`}`} disabled={item.levels.length === 1} onClick={() => updateItem(index, { levels: item.levels.filter((_, at) => at !== levelIndex) })}><Trash2 size={16} /></Button>
          </div>)}
          <Button type='button' variant='outline' size='sm' onClick={() => { const last = item.levels[item.levels.length - 1]; updateItem(index, { levels: [...item.levels, { level_min_score: last.level_max_score + 1, level_max_score: last.level_max_score + 2, level_desc: '' }] }); }}><Plus size={15} /> {t('ui.addLevel')}</Button>
        </div>
      </section>)}
      <Button type='button' variant='outline' onClick={() => setItems((current) => [...current, { ...blankCriterion(), rubric_item_weight: '0' }])}><Plus size={16} /> {t('ui.addCriterion')}</Button>
      <div className='flex justify-end gap-3 border-t pt-6'><Button variant='outline' onClick={() => router.push('/dashboard/rubrics')}>{t('ui.cancel')}</Button><Button disabled={saving} onClick={submit}>{saving ? t('ui.saving544882') : t('ui.createRubric')}</Button></div>
    </div>}
  </main>;
}
