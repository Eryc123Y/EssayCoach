'use client';

import { useState, type FormEvent } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { emailChangeService } from '@/service/api/v2/email-change';

export function EmailChangeSection({ currentEmail }: { currentEmail: string }) {
  const { locale } = usePreferences();
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await emailChangeService.request(newEmail.trim(), password);
      setSent(true);
      setPassword('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  return <section className='rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
    <h3 className='text-lg font-semibold'>{t('Change email address', '更改电子邮箱')}</h3>
    <p className='mt-2 text-sm text-slate-500'>{t('Current address', '当前地址')}: {currentEmail}</p>
    {sent ? <p role='status' className='mt-5 rounded-lg bg-teal-50 p-4 text-sm text-teal-900 dark:bg-teal-950 dark:text-teal-100'>{t('Verification link sent. Open it from your new inbox within one hour. In the private local setup, delivery appears in backend/outbox.', '验证链接已发送。请在一小时内从新邮箱打开链接。本地私有环境的邮件保存在 backend/outbox。')}</p> : <form onSubmit={submit} className='mt-5 grid max-w-xl gap-4'>
      <label className='grid gap-2 text-sm font-semibold'>{t('New email', '新电子邮箱')}<input type='email' required autoComplete='email' maxLength={254} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} className='rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal dark:border-slate-600 dark:bg-slate-800' /></label>
      <label className='grid gap-2 text-sm font-semibold'>{t('Current password', '当前密码')}<input type='password' required autoComplete='current-password' value={password} onChange={(event) => setPassword(event.target.value)} className='rounded-lg border border-slate-300 bg-white px-3 py-2 font-normal dark:border-slate-600 dark:bg-slate-800' /></label>
      <button type='submit' disabled={busy} className='justify-self-start rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>{busy ? t('Sending…', '正在发送…') : t('Send verification link', '发送验证链接')}</button>
    </form>}
    {error && <p role='alert' className='mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-100'>{error}</p>}
  </section>;
}
