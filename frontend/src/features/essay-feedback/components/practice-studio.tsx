'use client';

import { localized } from '@/locales';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, FileText, History, Loader2, PenLine, Send, Sparkles, Upload } from 'lucide-react';
import { practiceService } from '@/service/api/v2/practice';
import type { PracticeChatTurn, PracticeEssay, PracticeReport, PracticeRun, RubricListItem } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';
import './practice-studio.css';

type Language = 'en' | 'zh';
type Draft = {
  goal: string;
  content: string;
  language: Language;
  audience: string;
  tone: string;
  rubric_id: number | null;
};

const blankDraft = (language: Language): Draft => ({
  goal: '', content: '', language, audience: '', tone: '', rubric_id: null
});

function SkillMap({ skills, language }: { skills: PracticeReport['skills']; language: Language }) {
  const labels = language === 'zh'
    ? ['语法', '逻辑', '语气', '结构', '词汇']
    : ['Grammar', 'Logic', 'Tone', 'Structure', 'Vocabulary'];
  const values = [skills.grammar, skills.logic, skills.tone, skills.structure, skills.vocabulary];
  const point = (index: number, radius: number) => {
    const angle = -Math.PI / 2 + index * Math.PI * 2 / 5;
    return `${120 + Math.cos(angle) * radius},${112 + Math.sin(angle) * radius}`;
  };
  return (
    <svg className='practice-radar' viewBox='0 0 240 225' role='img' aria-label={language === 'zh' ? '写作能力图' : 'Writing skills chart'}>
      {[30, 60, 90].map(radius => (
        <polygon key={radius} points={values.map((_, index) => point(index, radius)).join(' ')} className='practice-radar-grid' />
      ))}
      {values.map((_, index) => <line key={index} x1='120' y1='112' x2={point(index, 90).split(',')[0]} y2={point(index, 90).split(',')[1]} className='practice-radar-axis' />)}
      <polygon points={values.map((value, index) => point(index, value * .9)).join(' ')} className='practice-radar-value' />
      {labels.map((label, index) => {
        const [x, y] = point(index, 109).split(',');
        return <text key={label} x={x} y={y} textAnchor='middle' dominantBaseline='middle'>{label}</text>;
      })}
    </svg>
  );
}

function ProgressDiff({ current, previous, language }: { current: PracticeReport; previous: PracticeReport; language: Language }) {
  const labels: Record<keyof PracticeReport['skills'], [string, string]> = {
    grammar: ['Grammar', '语法'], logic: ['Logic', '逻辑'], tone: ['Tone', '语气'],
    structure: ['Structure', '结构'], vocabulary: ['Vocabulary', '词汇']
  };
  const scoreChange = current.overall_score - previous.overall_score;
  const changedSkills = (Object.keys(labels) as Array<keyof PracticeReport['skills']>)
    .map(key => ({ key, delta: current.skills[key] - previous.skills[key] }))
    .filter(item => item.delta !== 0);
  const signed = (value: number) => `${value > 0 ? '+' : ''}${value}`;
  return <section className='practice-report-section' aria-label={language === 'zh' ? '与上一稿比较' : 'Compared with previous draft'}>
    <h3>{language === 'zh' ? '与上一稿比较' : 'Compared with previous draft'}</h3>
    <p>{language === 'zh' ? '同一量规下的练习评分变化：' : 'Practice score change under the same rubric: '}
      <strong>{signed(scoreChange)}</strong> {language === 'zh' ? '分' : 'points'}。
      {language === 'zh' ? '这是修改线索，不是正式成绩。' : 'Use this as a revision clue, not a formal grade.'}
    </p>
    {changedSkills.length > 0 && <div className='practice-feedback-columns'>
      {changedSkills.map(({ key, delta }) => <p key={key}><span>{labels[key][language === 'zh' ? 1 : 0]}</span> <strong>{signed(delta)}</strong></p>)}
    </div>}
  </section>;
}

function AnnotatedEssay({ content, annotations }: { content: string; annotations: PracticeReport['annotations'] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const segments = useMemo(() => {
    const matches = annotations.map((annotation, index) => ({
      annotation, index, start: content.indexOf(annotation.quote)
    })).filter(match => match.start >= 0).sort((a, b) => a.start - b.start);
    const output: Array<{ text: string; annotation?: PracticeReport['annotations'][number]; index?: number; key: string }> = [];
    let cursor = 0;
    for (const match of matches) {
      if (match.start < cursor) continue;
      if (match.start > cursor) output.push({ text: content.slice(cursor, match.start), key: `text-${cursor}` });
      output.push({ text: match.annotation.quote, annotation: match.annotation, index: match.index, key: `mark-${match.index}` });
      cursor = match.start + match.annotation.quote.length;
    }
    if (cursor < content.length) output.push({ text: content.slice(cursor), key: `text-${cursor}` });
    return output;
  }, [annotations, content]);
  const categoryClass = (category: string) => {
    if (/grammar|语法/i.test(category)) return 'grammar';
    if (/word|vocabulary|词汇|用词/i.test(category)) return 'word';
    if (/logic|structure|argument|逻辑|结构|论证/i.test(category)) return 'logic';
    if (/fact|source|evidence|事实|来源|证据/i.test(category)) return 'fact';
    return 'general';
  };
  const selectedAnnotation = selected === null ? null : annotations[selected];
  return <>
    <div className='practice-essay-text'>{segments.map(segment => segment.annotation
      ? <button key={segment.key} type='button' className={`practice-annotation ${categoryClass(segment.annotation.category)}`} aria-expanded={selected === segment.index} onClick={() => setSelected(current => current === segment.index ? null : segment.index!)}>{segment.text}</button>
      : <span key={segment.key}>{segment.text}</span>)}</div>
    {selectedAnnotation && <div className='practice-annotation-detail' role='note'><strong>{selectedAnnotation.category}</strong><p>{selectedAnnotation.explanation}</p><small>{selectedAnnotation.suggestion}</small></div>}
  </>;
}

export function PracticeStudio() {
  const { locale: uiLanguage, changeLocale } = usePreferences();
  const [draft, setDraft] = useState<Draft>(() => blankDraft(uiLanguage));
  const [essays, setEssays] = useState<PracticeEssay[]>([]);
  const [rubrics, setRubrics] = useState<RubricListItem[]>([]);
  const [essayId, setEssayId] = useState<string | null>(null);
  const [runs, setRuns] = useState<PracticeRun[]>([]);
  const [run, setRun] = useState<PracticeRun | null>(null);
  const [chatTurns, setChatTurns] = useState<PracticeChatTurn[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [mode, setMode] = useState<'write' | 'report'>('write');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const essayIdRef = useRef<string | null>(null);
  const versionRef = useRef<number | null>(null);
  const savedHashRef = useRef('');
  const saveChainRef = useRef<Promise<PracticeEssay | null>>(Promise.resolve(null));
  const generationRef = useRef(0);
  const loadedRef = useRef(false);
  const t = useCallback((en: string, zh?: string) => localized(uiLanguage, en, zh), [uiLanguage]);

  const openEssay = useCallback(async (essay: PracticeEssay) => {
    generationRef.current += 1;
    essayIdRef.current = essay.essay_id;
    versionRef.current = essay.version;
    const nextDraft: Draft = {
      goal: essay.goal, content: essay.content, language: essay.language,
      audience: essay.audience, tone: essay.tone, rubric_id: essay.rubric_id
    };
    setDraft(nextDraft);
    savedHashRef.current = JSON.stringify(nextDraft);
    setEssayId(essay.essay_id);
    setSavedAt(essay.updated_at);
    setMode('write');
    setError('');
    const history = await practiceService.listRuns(essay.essay_id);
    setRuns(history);
    setRun(history[0] ?? null);
  }, []);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    Promise.all([practiceService.listEssays(), practiceService.listPublicRubrics()])
      .then(async ([items, availableRubrics]) => {
        setEssays(items);
        setRubrics(availableRubrics);
        if (items[0]) await openEssay(items[0]);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'Could not load practice writing.'))
      .finally(() => setLoading(false));
  }, [openEssay]);

  const queueSave = useCallback((snapshot: Draft): Promise<PracticeEssay | null> => {
    const generation = generationRef.current;
    const hash = JSON.stringify(snapshot);
    const next = saveChainRef.current.catch(() => null).then(async () => {
      if (generation !== generationRef.current || hash === savedHashRef.current) return null;
      if (!snapshot.goal.trim()) return null;
      const currentId = essayIdRef.current;
      const response = currentId
        ? await practiceService.saveEssay(currentId, { ...snapshot, expected_version: versionRef.current ?? 1 })
        : await practiceService.createEssay(snapshot);
      if (generation !== generationRef.current) return response;
      essayIdRef.current = response.essay_id;
      versionRef.current = response.version;
      savedHashRef.current = hash;
      setEssayId(response.essay_id);
      setSavedAt(response.updated_at);
      setEssays(previous => [response, ...previous.filter(item => item.essay_id !== response.essay_id)]);
      setError('');
      return response;
    });
    saveChainRef.current = next;
    return next;
  }, []);

  useEffect(() => {
    if (loading || !draft.goal.trim() || JSON.stringify(draft) === savedHashRef.current) return;
    const timer = setTimeout(() => {
      void queueSave(draft).catch(cause => setError(cause instanceof Error ? cause.message : 'Draft could not be saved.'));
    }, 1300);
    return () => clearTimeout(timer);
  }, [draft, loading, queueSave]);

  const runId = run?.run_id;
  const runStatus = run?.status;
  useEffect(() => {
    if (!runId || (runStatus !== 'pending' && runStatus !== 'running')) return;
    const timer = setInterval(() => {
      void practiceService.getRun(runId).then(updated => {
        setRun(updated);
        setRuns(previous => [updated, ...previous.filter(item => item.run_id !== updated.run_id)]);
      }).catch(() => {});
    }, 2500);
    return () => clearInterval(timer);
  }, [runId, runStatus]);

  useEffect(() => {
    if (!runId || runStatus !== 'succeeded') {
      setChatTurns([]);
      return;
    }
    let current = true;
    void practiceService.listChat(runId).then(items => {
      if (current) setChatTurns(items);
    }).catch(() => {});
    return () => { current = false; };
  }, [runId, runStatus]);

  const waitingForCoach = chatTurns.some(item => item.status === 'pending' || item.status === 'running');
  useEffect(() => {
    if (!runId || !waitingForCoach) return;
    const timer = setInterval(() => {
      void practiceService.listChat(runId).then(setChatTurns).catch(() => {});
    }, 2500);
    return () => clearInterval(timer);
  }, [runId, waitingForCoach]);

  async function askCoach() {
    if (!runId || !chatInput.trim() || waitingForCoach) return;
    setChatBusy(true);
    try {
      const created = await practiceService.askCoach(runId, chatInput.trim());
      setChatTurns(previous => [...previous, created]);
      setChatInput('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.couldNotAskTheCoach'));
    } finally {
      setChatBusy(false);
    }
  }

  async function analyze() {
    if (!draft.goal.trim() || !draft.content.trim()) {
      setError(t('ui.addAWritingGoalAndEssayBeforeRequestingFeedback'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      await queueSave(draft);
      const id = essayIdRef.current;
      const version = versionRef.current;
      if (!id || !version) throw new Error('Draft was not saved.');
      const created = await practiceService.analyze(id, version);
      setRun(created);
      setRuns(previous => [created, ...previous.filter(item => item.run_id !== created.run_id)]);
      setMode('report');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.analysisCouldNotStart'));
    } finally {
      setBusy(false);
    }
  }

  function newEssay() {
    generationRef.current += 1;
    essayIdRef.current = null;
    versionRef.current = null;
    savedHashRef.current = '';
    setEssayId(null);
    setDraft(blankDraft(uiLanguage));
    setRuns([]);
    setRun(null);
    setMode('write');
    setSavedAt(null);
    setError('');
  }

  async function uploadText(file: File | undefined) {
    if (!file) return;
    if (!/\.(txt|md|pdf|docx)$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
      setError(t('ui.chooseATxtMdPdfOrDocxFileUnder10'));
      return;
    }
    try {
      const imported = await practiceService.importFile(file);
      setDraft(previous => ({ ...previous, content: imported.content }));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.couldNotReadTheDocument'));
    }
  }

  const count = draft.language === 'zh'
    ? draft.content.replace(/\s/g, '').length
    : draft.content.trim().split(/\s+/).filter(Boolean).length;
  const previousComparableRun = run?.report ? runs
    .filter(item => item.run_id !== run.run_id && item.status === 'succeeded' && item.report
      && item.revision_number < run.revision_number
      && JSON.stringify(item.revision_rubric) === JSON.stringify(run.revision_rubric))
    .sort((a, b) => b.revision_number - a.revision_number)[0] : undefined;

  return (
    <main className='practice-studio'>
      <div className='practice-topline'>
        <div>
          <span className='practice-kicker'>{t('ui.privateWritingPractice')}</span>
          <h1>{t('ui.writingStudio')}</h1>
          <p>{t('ui.writeFreelyGetFocusedFeedbackWhenYourDraftIsReady')}</p>
        </div>
        <div className='practice-top-actions'>
          <button type='button' className='practice-language' onClick={() => void changeLocale(uiLanguage === 'en' ? 'zh' : 'en')} aria-label='Switch interface language'>{uiLanguage === 'en' ? '中文' : 'EN'}</button>
          <button type='button' className='practice-outline' onClick={newEssay}><PenLine size={16} />{t('ui.newDraft')}</button>
        </div>
      </div>

      {error && <div className='practice-error' role='alert'>{error}</div>}
      {loading ? <div className='practice-loading'><Loader2 className='animate-spin' />{t('ui.openingYourStudio')}</div> : <>
        {essays.length > 0 && <div className='practice-history-strip' aria-label={t('ui.savedDrafts')}>
          <History size={16} />
          {essays.slice(0, 5).map(item => <button type='button' key={item.essay_id} className={essayId === item.essay_id ? 'selected' : ''} onClick={() => void openEssay(item)}>{item.goal}</button>)}
        </div>}
        {mode === 'write' ? <div className='practice-workspace'>
          <section className='practice-main-column'>
            <div className='practice-brief'>
              <label htmlFor='practice-goal'>{t('ui.whatAreYouTryingToWrite')}</label>
              <input id='practice-goal' value={draft.goal} maxLength={2000} onChange={event => setDraft(previous => ({ ...previous, goal: event.target.value }))} placeholder={t('ui.aQuestionPromptOrWritingGoal')} />
            </div>
            <div className='practice-paper'>
              <div className='practice-paper-head'><span><FileText size={17} />{t('ui.yourDraft')}</span><span>{count} {draft.language === 'zh' ? t('ui.characters') : t('ui.words')}</span></div>
              <textarea aria-label={t('ui.essayDraft')} value={draft.content} onChange={event => setDraft(previous => ({ ...previous, content: event.target.value }))} placeholder={t('ui.startWithAnIdeaWorthExploring')} />
              <div className='practice-paper-foot'><span>{savedAt ? `${t('ui.saved')} ${new Date(savedAt).toLocaleTimeString()}` : t('ui.aPrivateDraft')}</span><span>{t('ui.practiceFeedbackNeverBecomesAFormalGrade')}</span></div>
            </div>
            <div className='practice-action-row'>
              <label className='practice-outline practice-upload'><Upload size={16} />{t('ui.importDocument')}<input type='file' accept='.txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document' onChange={event => void uploadText(event.target.files?.[0])} /></label>
              <button type='button' className='practice-outline' onClick={() => void queueSave(draft).catch(cause => setError(String(cause)))}>{t('ui.saveDraft')}</button>
              <button type='button' className='practice-primary' disabled={busy || !draft.goal.trim() || !draft.content.trim()} onClick={() => void analyze()}>{busy ? <Loader2 className='animate-spin' size={17} /> : <Sparkles size={17} />}{t('ui.getPracticeFeedback')}</button>
            </div>
          </section>
          <aside className='practice-rail'>
            <div className='practice-rail-section'><h2>{t('ui.makeItYours')}</h2><p>{t('ui.theseChoicesGuideFeedbackWithoutChangingYourWords')}</p></div>
            <label>{t('ui.essayLanguage')}<select value={draft.language} onChange={event => setDraft(previous => ({ ...previous, language: event.target.value as Language }))}><option value='en'>English</option><option value='zh'>中文</option></select></label>
            <label>{t('ui.audience')}<input value={draft.audience} maxLength={80} onChange={event => setDraft(previous => ({ ...previous, audience: event.target.value }))} placeholder={t('ui.eGUniversityStudents')} /></label>
            <label>{t('ui.tone')}<input value={draft.tone} maxLength={80} onChange={event => setDraft(previous => ({ ...previous, tone: event.target.value }))} placeholder={t('ui.eGAnalytical')} /></label>
            <label>{t('ui.practiceRubric')}<select value={draft.rubric_id ?? ''} onChange={event => setDraft(previous => ({ ...previous, rubric_id: event.target.value ? Number(event.target.value) : null }))}><option value=''>{t('ui.generalWritingFeedback')}</option>{rubrics.map(item => <option key={item.rubric_id} value={item.rubric_id}>{item.rubric_desc || `Rubric ${item.rubric_id}`}</option>)}</select></label>
            {runs.length > 0 && <div className='practice-revisions'><h2>{t('ui.earlierFeedback')}</h2>{runs.map(item => <button type='button' key={item.run_id} onClick={() => { setRun(item); setMode('report'); }}><span>{t('ui.revision')} {item.revision_number}</span><small>{new Date(item.created_at).toLocaleDateString()}</small><ChevronRight size={15} /></button>)}</div>}
          </aside>
        </div> : <div className='practice-report'>
          <button type='button' className='practice-back' onClick={() => setMode('write')}><ArrowLeft size={16} />{t('ui.backToDraft')}</button>
          {!run ? <p>{t('ui.noFeedbackYetStartWithADraft')}</p> : run.status === 'pending' || run.status === 'running' ? <div className='practice-wait'><Loader2 className='animate-spin' size={26} /><h2>{t('ui.readingYourDraft')}</h2><p>{t('ui.theReportAndSourceChecksWillAppearHereWhenReady')}</p></div> : run.status === 'failed' ? <div className='practice-wait'><h2>{t('ui.analysisStopped')}</h2><p>{run.error_message}</p><button type='button' className='practice-primary' onClick={() => void practiceService.retryRun(run.run_id).then(setRun).catch(cause => setError(String(cause)))}>{t('ui.retryAnalysis')}</button></div> : run.report ? <>
            <div className='practice-report-head'><div><span>{t('ui.practiceFeedback')} · {t('ui.revision')} {run.revision_number}</span><h2>{run.report.headline}</h2><p>{t('ui.aGuideForYourNextDraftThisIsNotA')}</p></div><div className='practice-score'><strong>{run.report.overall_score}</strong><span>/100</span></div></div>
            <div className='practice-report-grid'><div className='practice-report-main'>
              <section className='practice-report-section'><h3>{t('ui.yourEssayWithNotes')}</h3><AnnotatedEssay content={run.revision_content} annotations={run.report.annotations} />{run.report.annotations.length > 0 && <div className='practice-notes'>{run.report.annotations.map((item, index) => <div key={index}><span>{item.category}</span><strong>{item.quote}</strong><p>{item.explanation}</p><small>{item.suggestion}</small></div>)}</div>}</section>
              <section className='practice-report-section'><h3>{t('ui.overallFeedback')}</h3><p>{run.report.general_feedback}</p><div className='practice-feedback-columns'><div><h4>{t('ui.whatWorks')}</h4>{run.report.strengths.map((item, index) => <p key={index}><Check size={15} />{item}</p>)}</div><div><h4>{t('ui.nextSteps')}</h4>{run.report.next_steps.map((item, index) => <p key={index}><ChevronRight size={15} />{item}</p>)}</div></div></section>
              {previousComparableRun?.report && <ProgressDiff current={run.report} previous={previousComparableRun.report} language={uiLanguage} />}
              {run.report.rubric_results.length > 0 && <section className='practice-report-section'><h3>{t('ui.rubricBreakdown')}</h3>{run.report.rubric_results.map((item, index) => {
                const criterion = run.revision_rubric?.find(snapshot => snapshot.name === item.criterion) ?? run.revision_rubric?.[index];
                return <div className='practice-rubric-row' key={index}><div><strong>{item.criterion}</strong><span>{item.score}/{item.max_score}</span></div><p>{item.justification}</p>{criterion?.exemplar_text && <details className='practice-exemplar'><summary>{t('ui.viewHighScoringExemplar')}</summary><p>{criterion.exemplar_text}</p></details>}</div>;
              })}</section>}
            </div><aside className='practice-report-rail'><section><h3>{t('ui.writingSkills')}</h3><SkillMap skills={run.report.skills} language={uiLanguage} /></section><section><h3>{t('ui.sourceChecks')}</h3><p className='practice-source-intro'>{t('ui.onlyClaimsWithARetrievedMatchingSourceQuoteAreMarked')}</p>{run.evidence.length === 0 ? <p>{t('ui.noCheckableFactualClaimsWereIdentified')}</p> : run.evidence.map((item, index) => <div className='practice-evidence' key={index}><span className={`practice-verdict ${item.verdict}`}>{item.verdict === 'supported' ? t('ui.sourceSupports') : item.verdict === 'contradicted' ? t('ui.sourceConflicts') : t('ui.unresolved')}</span><p>{item.claim}</p>{item.source_url && <><blockquote>{item.supporting_quote}</blockquote><a href={item.source_url} target='_blank' rel='noopener noreferrer'>{item.source_title || t('ui.openSource')}</a></>}<small>{item.rationale}</small></div>)}</section><section className='practice-coach'><h3>{t('ui.askYourWritingCoach')}</h3><p>{t('ui.askAboutThisReportOrAPossibleRevision')}</p><div className='practice-chat-history'>{chatTurns.length === 0 && <small>{t('ui.yourConversationWillStayWithThisRevision')}</small>}{chatTurns.map(item => <div key={item.turn_id} className='practice-chat-turn'><p className='practice-chat-question'>{item.question}</p>{item.status === 'succeeded' ? <p className='practice-chat-answer'>{item.answer}</p> : item.status === 'failed' ? <div className='practice-chat-error'><span>{item.error_message}</span><button type='button' onClick={() => void practiceService.retryCoach(item.turn_id).then(updated => setChatTurns(previous => previous.map(turn => turn.turn_id === updated.turn_id ? updated : turn)))}>{t('ui.retry')}</button></div> : <p className='practice-chat-pending'><Loader2 className='animate-spin' size={14} />{t('ui.thinking')}</p>}</div>)}</div><div className='practice-chat-input'><textarea aria-label={t('ui.askTheCoach')} value={chatInput} maxLength={2000} onChange={event => setChatInput(event.target.value)} placeholder={t('ui.whatShouldIReviseFirst')} /><button type='button' aria-label={t('ui.sendQuestion')} disabled={chatBusy || waitingForCoach || !chatInput.trim()} onClick={() => void askCoach()}><Send size={16} /></button></div></section><button type='button' className='practice-outline practice-print' onClick={() => window.print()}>{t('ui.printOrSavePdf')}</button></aside></div>
          </> : null}
        </div>}
      </>}
    </main>
  );
}
