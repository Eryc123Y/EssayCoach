'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import Link from 'next/link';
import { IconArrowUpRight, IconLifebuoy, IconSearch } from '@tabler/icons-react';
import { usePreferences } from '@/components/layout/preference-provider';
import type { DashboardRole } from '@/lib/server-dashboard-auth';
import { helpService, type HelpArticle, type SupportTicket } from '@/service/api/v2/help';

const CATEGORIES = [
  ['all', 'All topics', '全部主题'],
  ['getting_started', 'Getting started', '开始使用'],
  ['essays', 'Writing & feedback', '写作与反馈'],
  ['rubrics', 'Teaching & grading', '教学与评分'],
  ['account', 'Accounts', '账号'],
  ['faq', 'Troubleshooting', '疑难解答'],
] as const;

export function HelpCenter({ role }: { role: DashboardRole }) {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState('all');
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [adminTickets, setAdminTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const t = (en: string, zh: string) => language === 'zh' ? zh : en;

  useEffect(() => {
    let active = true;
    setLoading(true);
    helpService.listArticles(language, deferredQuery, category === 'all' ? '' : category)
      .then((items) => { if (active) { setArticles(items); setError(''); } })
      .catch(() => { if (active) setError('Could not load help articles. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language, deferredQuery, category]);

  useEffect(() => {
    helpService.listTickets().then(setTickets).catch(() => setError('Could not load support tickets.'));
    if (role === 'admin') {
      helpService.listAdminTickets().then(setAdminTickets).catch(() => setError('Could not load the support queue.'));
    }
  }, [role]);

  async function submitTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!subject.trim() || description.trim().length < 10) return;
    setSending(true);
    try {
      const ticket = await helpService.createTicket({ subject: subject.trim(), description: description.trim(), priority: 'normal' });
      setTickets((current) => [ticket, ...current]);
      if (role === 'admin') setAdminTickets((current) => [ticket, ...current]);
      setSubject('');
      setDescription('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send your request.');
    } finally {
      setSending(false);
    }
  }

  async function resolveTicket(ticket: SupportTicket) {
    const reply = window.prompt(t('Reply to this request', '回复此请求'), ticket.staff_reply);
    if (reply === null) return;
    try {
      const updated = await helpService.updateTicket(ticket.id, { status: 'resolved', staff_reply: reply });
      setAdminTickets((current) => current.map((item) => item.id === updated.id ? updated : item));
      setTickets((current) => current.map((item) => item.id === updated.id ? updated : item));
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update the request.');
    }
  }

  return <main className='mx-auto max-w-6xl px-5 py-9 md:px-9 md:py-14'>
    <div className='flex flex-wrap items-start justify-between gap-6'>
      <div><p className='text-xs font-bold uppercase tracking-[0.22em] text-teal-700'>ESSAYCOACH / HELP</p>
        <h1 className='mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-50 md:text-5xl'>{t('How can we help?', '我们可以如何帮助你？')}</h1>
        <p className='mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300'>{t('Practical guides for writing, teaching, and managing your local workspace.', '了解写作、教学与管理本地平台的实用指南。')}</p>
      </div>
      <button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:border-teal-500'>{language === 'en' ? '中文' : 'English'}</button>
    </div>

    <section className='mt-10 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm md:p-8'>
      <label className='flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 focus-within:border-teal-600'>
        <IconSearch size={20} className='text-slate-500' />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search questions and guides', '搜索问题与指南')} aria-label={t('Search help', '搜索帮助')} className='w-full bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-500' />
      </label>
      <div className='mt-5 flex flex-wrap gap-2'>{CATEGORIES.map(([value, en, zh]) => <button type='button' key={value} onClick={() => setCategory(value)} aria-pressed={category === value} className={`rounded-full px-4 py-2 text-sm font-medium ${category === value ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{t(en, zh)}</button>)}</div>
      {error && <p role='alert' className='mt-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-800'>{error}</p>}
      <div className='mt-7 grid gap-3 md:grid-cols-2'>
        {loading ? <p className='text-slate-500'>{t('Loading guides…', '正在加载指南…')}</p> : articles.length ? articles.map((article) => <Link key={article.slug} href={`/dashboard/help/${article.slug}?language=${language}`} className='group rounded-2xl border border-slate-200 p-5 transition hover:border-teal-500 hover:bg-teal-50/50'>
          <div className='flex items-start justify-between gap-3'><h2 className='text-lg font-semibold text-slate-900'>{article.title}</h2><IconArrowUpRight size={19} className='text-slate-400 transition group-hover:text-teal-700' /></div>
          <p className='mt-2 line-clamp-2 text-sm leading-6 text-slate-600'>{article.content}</p>
        </Link>) : <p className='text-slate-500'>{t('No guides match this search.', '没有找到匹配的指南。')}</p>}
      </div>
    </section>

    <section className='mt-9 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]'>
      <div className='rounded-[2rem] bg-slate-900 p-7 text-white md:p-9'><IconLifebuoy size={28} className='text-teal-300' />
        <h2 className='mt-4 text-2xl font-semibold'>{t('Still need help?', '还需要帮助？')}</h2>
        <p className='mt-2 text-sm leading-6 text-slate-300'>{t('Send a request to your institution’s local support team. You can follow its status here.', '向机构的本地支持团队提交请求，并在这里查看处理状态。')}</p>
        <form onSubmit={submitTicket} className='mt-6 space-y-3'>
          <input required maxLength={200} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder={t('Subject', '主题')} aria-label={t('Subject', '主题')} className='w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-teal-300' />
          <textarea required minLength={10} rows={4} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t('Describe the issue (at least 10 characters)', '描述问题（至少 10 个字符）')} aria-label={t('Description', '问题描述')} className='w-full resize-y rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-teal-300' />
          <button disabled={sending} className='rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60'>{sending ? t('Sending…', '正在提交…') : t('Send request', '提交请求')}</button>
        </form>
      </div>
      <div className='rounded-[2rem] border border-slate-200 bg-white p-7 md:p-9'><h2 className='text-2xl font-semibold text-slate-950'>{t('Your requests', '我的请求')}</h2>
        <div className='mt-5 space-y-3'>{tickets.length ? tickets.map((ticket) => <article key={ticket.id} className='rounded-xl border border-slate-200 p-4'>
          <div className='flex items-center justify-between gap-3'><strong className='text-sm text-slate-900'>{ticket.subject}</strong><span className='rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700'>{ticket.status.replace('_', ' ')}</span></div>
          {ticket.staff_reply && <p className='mt-2 text-sm leading-6 text-slate-600'>{ticket.staff_reply}</p>}
        </article>) : <p className='text-sm text-slate-500'>{t('No requests yet.', '还没有支持请求。')}</p>}</div>
      </div>
    </section>

    {role === 'admin' && <section className='mt-9 rounded-[2rem] border border-slate-200 bg-white p-7 md:p-9'><h2 className='text-2xl font-semibold text-slate-950'>{t('Support queue', '支持队列')}</h2><div className='mt-5 space-y-3'>{adminTickets.length ? adminTickets.map((ticket) => <div key={ticket.id} className='flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4'><div><strong className='text-sm text-slate-900'>#{ticket.id} · {ticket.subject}</strong><p className='mt-1 text-sm text-slate-600'>{ticket.description}</p></div><button type='button' onClick={() => resolveTicket(ticket)} className='rounded-full border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-800 hover:bg-teal-50'>{ticket.status === 'resolved' ? t('Edit reply', '编辑回复') : t('Reply & resolve', '回复并解决')}</button></div>) : <p className='text-sm text-slate-500'>{t('The queue is empty.', '队列为空。')}</p>}</div></section>}
  </main>;
}
