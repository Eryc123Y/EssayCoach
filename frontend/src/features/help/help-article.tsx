'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { helpService, type ArticleVote, type HelpArticle as Article, type HelpLanguage } from '@/service/api/v2/help';
import { localized } from '@/locales';

const CATEGORY_LABEL_IDS: Record<string, string> = {
  getting_started: 'ui.helpCategoryGettingStarted',
  essays: 'ui.helpCategoryWritingFeedback',
  rubrics: 'ui.helpCategoryTeachingGrading',
  account: 'ui.helpCategoryAccounts',
  faq: 'ui.helpCategoryTroubleshooting',
};

export function HelpArticle({ slug, initialLanguage }: { slug: string; initialLanguage: HelpLanguage }) {
  const [language, setLanguage] = useState(initialLanguage);
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');
  const [vote, setVote] = useState<ArticleVote | null>(null);
  const [voteBusy, setVoteBusy] = useState(false);
  const [voteError, setVoteError] = useState('');
  useEffect(() => {
    let active = true;
    helpService.getArticle(slug, language).then((value) => { if (active) { setArticle(value); setError(''); } })
      .catch(() => { if (active) { setArticle(null); setError(localized(language, 'ui.couldNotLoadThisArticle')); } });
    return () => { active = false; };
  }, [slug, language]);
  useEffect(() => {
    let active = true;
    helpService.getArticleVote(slug).then((value) => { if (active) setVote(value); })
      .catch(() => { if (active) setVoteError(localized(language, 'ui.couldNotLoadArticleFeedback')); });
    return () => { active = false; };
  }, [slug, language]);
  async function submitVote(helpful: boolean) {
    setVoteBusy(true);
    try {
      setVote(await helpService.voteOnArticle(slug, helpful));
      setVoteError('');
    } catch {
      setVoteError(localized(language, 'ui.couldNotSaveFeedbackPleaseTryAgain'));
    } finally {
      setVoteBusy(false);
    }
  }
  return <main className='mx-auto max-w-3xl px-5 py-10 md:py-16'>
    <div className='flex items-center justify-between gap-4'><Link href='/dashboard/help' className='inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline'><IconArrowLeft size={17} />{localized(language, 'ui.backToHelp')}</Link><button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold'>{language === 'en' ? '中文' : 'English'}</button></div>
    {error && <p role='alert' className='mt-10 rounded-2xl bg-rose-50 p-5 text-rose-800'>{error}</p>}
    {!error && !article && <p className='mt-10 text-slate-500'>{localized(language, 'ui.loading')}</p>}
    {article && <article className='mt-12'><nav aria-label={localized(language, 'ui.backToHelp')} className='mb-4 text-sm text-slate-600'><Link href='/dashboard/help' className='underline'>{localized(language, 'ui.backToHelp')}</Link><span> / </span><Link href={`/dashboard/help?category=${article.category}`} className='underline'>{localized(language, CATEGORY_LABEL_IDS[article.category] ?? article.category)}</Link><span> / </span><span aria-current='page'>{article.title}</span></nav><p className='text-xs font-bold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / {localized(language, CATEGORY_LABEL_IDS[article.category] ?? article.category)}</p><h1 className='mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-5xl'>{article.title}</h1><div className='mt-8 h-px bg-slate-200 dark:bg-slate-700' /><p className='mt-9 whitespace-pre-line text-lg leading-9 text-slate-700 dark:text-slate-200'>{article.content}</p><div className='mt-12 rounded-2xl border border-slate-200 p-5 dark:border-slate-700'><p className='font-semibold text-slate-900 dark:text-slate-100'>{localized(language, 'ui.wasThisGuideHelpful')}</p><div className='mt-3 flex flex-wrap gap-2'>{([true, false] as const).map((helpful) => <button key={String(helpful)} type='button' disabled={voteBusy} aria-pressed={vote?.helpful === helpful} onClick={() => void submitVote(helpful)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${vote?.helpful === helpful ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-700 dark:text-slate-200'}`}>{helpful ? (localized(language, 'ui.yes')) : (localized(language, 'ui.no'))}</button>)}</div>{voteError && <p role='alert' className='mt-3 text-sm text-red-700'>{voteError}</p>}</div></article>}
  </main>;
}
