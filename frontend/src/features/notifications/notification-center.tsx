'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconBell, IconRefresh } from '@tabler/icons-react';
import { usePreferences } from '@/components/layout/preference-provider';
import { notificationService, type Inbox } from '@/service/api/v2/notifications';

export function NotificationCenter() {
  const router = useRouter();
  const { locale, changeLocale } = usePreferences();
  const [inbox, setInbox] = useState<Inbox>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const refresh = useCallback(async () => {
    setLoading(true);
    try { setInbox(await notificationService.list()); setError(''); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function open(id: number, link: string) {
    try {
      await notificationService.markRead(id);
      window.dispatchEvent(new Event('essaycoach:notifications-changed'));
      if (!link.startsWith('/dashboard/')) throw new Error('Invalid destination');
      router.push(link);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
      void refresh();
    }
  }

  return <main className='mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-7 lg:px-10'>
    <header className='flex flex-wrap items-start justify-between gap-4'><div><p className='text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300'>ESSAYCOACH / INBOX</p><h1 className='mt-3 text-4xl font-semibold tracking-tight'>{t('Notifications', '通知')}</h1><p className='mt-3 text-slate-600 dark:text-slate-300'>{t('Updates about your writing and teaching work.', '查看写作与教学相关的进展。')}</p></div><div className='flex gap-2'><button type='button' onClick={() => { void changeLocale(locale === 'en' ? 'zh' : 'en'); }} className='rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold dark:border-slate-600'>{locale === 'en' ? '中文' : 'English'}</button><button type='button' onClick={() => { void refresh(); }} className='inline-flex items-center gap-2 rounded-full bg-teal-300 px-4 py-2 text-sm font-bold text-slate-950'><IconRefresh size={17} />{t('Refresh', '刷新')}</button></div></header>
    {error && <p role='alert' className='rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200'>{error}</p>}
    <section className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900'><div className='flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700'><h2 className='text-lg font-semibold'>{t('Your inbox', '收件箱')}</h2><span className='rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800 dark:bg-teal-950 dark:text-teal-200'>{inbox?.unread_count ?? 0} {t('unread', '条未读')}</span></div>
      {loading && !inbox ? <p className='p-6 text-sm text-slate-500'>{t('Loading notifications…', '正在加载通知…')}</p> : inbox?.items.length ? <ul className='divide-y divide-slate-100 dark:divide-slate-800'>{inbox.items.map((item) => <li key={item.id}><button type='button' onClick={() => { void open(item.id, item.link); }} className={`flex w-full items-start gap-4 p-5 text-left hover:bg-teal-50 dark:hover:bg-slate-800 ${item.read_at ? '' : 'bg-teal-50/50 dark:bg-teal-950/20'}`}><span className='mt-1 rounded-xl bg-teal-100 p-2 text-teal-800 dark:bg-teal-950 dark:text-teal-300'><IconBell size={19} /></span><span className='min-w-0 flex-1'><strong className='block text-sm'>{locale === 'zh' ? item.title_zh : item.title_en}</strong><span className='mt-1 block text-sm text-slate-600 dark:text-slate-300'>{locale === 'zh' ? item.body_zh : item.body_en}</span><time className='mt-2 block text-xs text-slate-500'>{new Date(item.created_at).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US')}</time></span>{!item.read_at && <span className='mt-2 h-2 w-2 shrink-0 rounded-full bg-teal-600' aria-label={t('Unread', '未读')} />}</button></li>)}</ul> : <p className='p-8 text-center text-sm text-slate-500'>{t('All caught up. New feedback and assessment updates will appear here.', '暂无新消息。练习反馈和成绩更新会显示在这里。')}</p>}
    </section>
  </main>;
}
