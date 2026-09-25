'use client';

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
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
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
    if (!name.trim()) return toast.error(t('Add a rubric name.', '请填写量规名称。'));
    if (Math.abs(total - 100) > 0.001) return toast.error(t('Weights must total 100%.', '权重合计必须为 100%。'));
    if (items.some((item) => !item.rubric_item_name.trim() || !item.levels.length || item.levels.some((level) => !level.level_desc.trim()))) {
      return toast.error(t('Name every criterion and describe each score level.', '请填写每个评分维度和等级说明。'));
    }
    for (const item of items) {
      let expected = 0;
      for (const level of [...item.levels].sort((a, b) => a.level_min_score - b.level_min_score)) {
        if (level.level_min_score !== expected || level.level_max_score < level.level_min_score) {
          return toast.error(t('Score ranges must begin at 0 without gaps or overlaps.', '分数区间须从 0 开始，且不能有空缺或重叠。'));
        }
        expected = level.level_max_score + 1;
      }
    }
    setSaving(true);
    try {
      const created = await createManualRubric({ rubric_desc: name.trim(), visibility, items });
      toast.success(t('Rubric created', '量规已创建'));
      router.push(`/dashboard/rubrics/${created.rubric_id}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Could not create rubric', '无法创建量规'));
    } finally { setSaving(false); }
  };

  return <main className='mx-auto max-w-5xl px-4 py-7 md:px-9 md:py-10'>
    <button type='button' onClick={() => router.push('/dashboard/rubrics')} className='mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-700 dark:text-slate-300'>
      <ArrowLeft size={16} /> {t('Rubric library', '返回量规库')}
    </button>
    <header className='border-b-4 border-indigo-500 bg-[#111b35] p-6 text-white md:p-9'>
      <div className='mb-4 flex items-center gap-2 text-sm font-medium text-indigo-200'><Scale size={16} /> {t('Rubric workshop', '量规工作台')}</div>
      <h1 className='text-3xl font-semibold tracking-tight md:text-4xl'>{sourceId ? t('Create a revised copy', '创建修订副本') : t('Build a rubric', '创建评分量规')}</h1>
      <p className='mt-2 max-w-2xl text-sm leading-6 text-slate-300'>{t('Define criteria and score ranges. Existing assignments retain their original rubric snapshot.', '设置评分维度和分数区间。现有作业仍保留原来的量规快照。')}</p>
    </header>

    {loadingTemplate ? <p className='py-12 text-center text-slate-500'>{t('Loading template…', '正在载入模板…')}</p> : <div className='mt-7 space-y-6'>
      <section className='grid gap-5 border-b border-stone-200 bg-white p-5 md:grid-cols-[1fr_auto] md:p-7 dark:border-slate-800 dark:bg-slate-900'>
        <label className='space-y-2 text-sm font-medium'>{t('Rubric name', '量规名称')}<Input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={t('e.g. Academic argument', '例如：学术论证')} className='mt-2' /></label>
        <label className='space-y-2 text-sm font-medium'>{t('Visibility', '可见范围')}<select value={visibility} onChange={(event) => setVisibility(event.target.value as 'private' | 'public')} className={`mt-2 ${field}`}>
          <option value='private'>{t('Private', '私人')}</option>{canPublish && <option value='public'>{t('Public to institution', '对机构公开')}</option>}
        </select></label>
      </section>

      <div className='flex flex-wrap items-end justify-between gap-3'><div><h2 className='text-xl font-semibold'>{t('Scoring criteria', '评分维度')}</h2><p className='text-sm text-slate-500'>{t('Arrange the criteria in the order students should read them.', '按照学生阅读的顺序排列维度。')}</p></div><div className={`rounded-full px-4 py-2 text-sm font-semibold ${Math.abs(total - 100) < 0.001 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>{t('Total weight', '权重合计')} {total.toFixed(1)}%</div></div>
      {items.map((item, index) => <section key={index} className='border-l-4 border-indigo-500 bg-white p-5 md:p-7 dark:bg-slate-900'>
        <div className='mb-5 flex flex-wrap items-center justify-between gap-2'><h3 className='text-lg font-semibold'>{String(index + 1).padStart(2, '0')} / {t('Criterion', '评分维度')}</h3><div className='flex gap-1'>
          <Button type='button' variant='ghost' size='icon' disabled={index === 0} aria-label={t('Move up', '上移')} onClick={() => moveItem(index, -1)}><ArrowUp size={16} /></Button>
          <Button type='button' variant='ghost' size='icon' disabled={index === items.length - 1} aria-label={t('Move down', '下移')} onClick={() => moveItem(index, 1)}><ArrowDown size={16} /></Button>
          <Button type='button' variant='ghost' size='icon' disabled={items.length === 1} aria-label={t('Remove criterion', '删除维度')} onClick={() => setItems((current) => current.filter((_, at) => at !== index))}><Trash2 size={16} /></Button>
        </div></div>
        <div className='grid gap-4 sm:grid-cols-[1fr_150px]'>
          <label className='text-sm font-medium'>{t('Name', '名称')}<Input className='mt-2' value={item.rubric_item_name} maxLength={50} onChange={(event) => updateItem(index, { rubric_item_name: event.target.value })} /></label>
          <label className='text-sm font-medium'>{t('Weight %', '权重 %')}<Input className='mt-2' type='number' min='0.1' max='100' step='0.1' value={item.rubric_item_weight} onChange={(event) => updateItem(index, { rubric_item_weight: event.target.value })} /></label>
        </div>
        <label className='mt-4 block text-sm font-medium'>{t('High-scoring exemplar · optional', '高分范例 · 可选')}<Textarea className='mt-2 min-h-24' value={item.exemplar_text} onChange={(event) => updateItem(index, { exemplar_text: event.target.value })} placeholder={t('A short example of strong writing for this criterion', '简短展示本维度的优秀写法')} /></label>
        <div className='mt-6 space-y-3'><h4 className='text-sm font-semibold'>{t('Score levels', '分数等级')}</h4>
          {item.levels.map((level, levelIndex) => <div key={levelIndex} className='grid gap-2 rounded-xl bg-stone-50 p-3 sm:grid-cols-[75px_75px_1fr_auto] dark:bg-slate-950'>
            <label className='text-xs text-slate-500'>{t('From', '从')}<Input className='mt-1' type='number' min='0' max='100' value={level.level_min_score} onChange={(event) => updateLevel(index, levelIndex, { level_min_score: Number(event.target.value) })} /></label>
            <label className='text-xs text-slate-500'>{t('To', '至')}<Input className='mt-1' type='number' min='0' max='100' value={level.level_max_score} onChange={(event) => updateLevel(index, levelIndex, { level_max_score: Number(event.target.value) })} /></label>
            <label className='text-xs text-slate-500'>{t('Description', '等级说明')}<Input className='mt-1' value={level.level_desc} onChange={(event) => updateLevel(index, levelIndex, { level_desc: event.target.value })} /></label>
            <Button type='button' variant='ghost' size='icon' className='self-end' aria-label={`${t('Remove level', '删除等级')} ${level.level_min_score}–${level.level_max_score} · ${item.rubric_item_name || `${index + 1}`}`} disabled={item.levels.length === 1} onClick={() => updateItem(index, { levels: item.levels.filter((_, at) => at !== levelIndex) })}><Trash2 size={16} /></Button>
          </div>)}
          <Button type='button' variant='outline' size='sm' onClick={() => { const last = item.levels[item.levels.length - 1]; updateItem(index, { levels: [...item.levels, { level_min_score: last.level_max_score + 1, level_max_score: last.level_max_score + 2, level_desc: '' }] }); }}><Plus size={15} /> {t('Add level', '添加等级')}</Button>
        </div>
      </section>)}
      <Button type='button' variant='outline' onClick={() => setItems((current) => [...current, { ...blankCriterion(), rubric_item_weight: '0' }])}><Plus size={16} /> {t('Add criterion', '添加维度')}</Button>
      <div className='flex justify-end gap-3 border-t pt-6'><Button variant='outline' onClick={() => router.push('/dashboard/rubrics')}>{t('Cancel', '取消')}</Button><Button disabled={saving} onClick={submit}>{saving ? t('Saving…', '正在保存…') : t('Create rubric', '创建量规')}</Button></div>
    </div>}
  </main>;
}
