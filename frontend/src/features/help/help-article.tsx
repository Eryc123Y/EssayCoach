'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowLeft } from '@tabler/icons-react';
import { helpService, type ArticleVote, type HelpArticle as Article, type HelpLanguage } from '@/service/api/v2/help';

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
      .catch(() => { if (active) { setArticle(null); setError(language === 'zh' ? '无法加载文章。' : 'Could not load this article.'); } });
    return () => { active = false; };
  }, [slug, language]);
  useEffect(() => {
    let active = true;
    helpService.getArticleVote(slug).then((value) => { if (active) setVote(value); })
      .catch(() => { if (active) setVoteError(language === 'zh' ? '无法读取文章反馈。' : 'Could not load article feedback.'); });
    return () => { active = false; };
  }, [slug, language]);
  async function submitVote(helpful: boolean) {
    setVoteBusy(true);
    try {
      setVote(await helpService.voteOnArticle(slug, helpful));
      setVoteError('');
    } catch {
      setVoteError(language === 'zh' ? '无法保存反馈，请重试。' : 'Could not save feedback. Please try again.');
    } finally {
      setVoteBusy(false);
    }
  }
  return <main className='mx-auto max-w-3xl px-5 py-10 md:py-16'>
    <div className='flex items-center justify-between gap-4'><Link href='/dashboard/help' className='inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:underline'><IconArrowLeft size={17} />{language === 'zh' ? '返回帮助中心' : 'Back to Help'}</Link><button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold'>{language === 'en' ? '中文' : 'English'}</button></div>
    {error && <p role='alert' className='mt-10 rounded-2xl bg-rose-50 p-5 text-rose-800'>{error}</p>}
    {!error && !article && <p className='mt-10 text-slate-500'>{language === 'zh' ? '正在加载…' : 'Loading…'}</p>}
    {article && <article className='mt-12'><p className='text-xs font-bold uppercase tracking-[0.22em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / {article.category.replace('_', ' ')}</p><h1 className='mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-5xl'>{article.title}</h1><div className='mt-8 h-px bg-slate-200 dark:bg-slate-700' /><p className='mt-9 whitespace-pre-line text-lg leading-9 text-slate-700 dark:text-slate-200'>{article.content}</p><div className='mt-12 rounded-2xl border border-slate-200 p-5 dark:border-slate-700'><p className='font-semibold text-slate-900 dark:text-slate-100'>{language === 'zh' ? '这篇指南有帮助吗？' : 'Was this guide helpful?'}</p><div className='mt-3 flex flex-wrap gap-2'>{([true, false] as const).map((helpful) => <button key={String(helpful)} type='button' disabled={voteBusy} aria-pressed={vote?.helpful === helpful} onClick={() => void submitVote(helpful)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${vote?.helpful === helpful ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-300 text-slate-700 dark:text-slate-200'}`}>{helpful ? (language === 'zh' ? '有帮助' : 'Yes') : (language === 'zh' ? '没帮助' : 'No')}</button>)}</div>{voteError && <p role='alert' className='mt-3 text-sm text-red-700'>{voteError}</p>}</div></article>}
  </main>;
}
