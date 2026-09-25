'use client';

import { localized } from '@/locales';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { emailChangeService } from '@/service/api/v2/email-change';

export default function VerifyEmailPage() {
  const [locale, setLocale] = useState<'en' | 'zh'>('en');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const t = (en: string, zh?: string) => localized(locale, en, zh);

  useEffect(() => {
    let value = '';
    try { value = window.location.hash.startsWith('#token=') ? decodeURIComponent(window.location.hash.slice(7)) : ''; }
    catch { setError('Verification link is invalid.'); setChecking(false); return; }
    if (!value) { setError('Verification link is missing.'); setChecking(false); return; }
    window.history.replaceState(null, '', window.location.pathname);
    setToken(value);
    emailChangeService.preview(value)
      .then((result) => { setEmail(result.new_email); setError(''); })
      .catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)))
      .finally(() => setChecking(false));
  }, []);

  async function confirm() {
    setBusy(true);
    try {
      await emailChangeService.complete(token);
      await fetch('/api/v2/auth/logout/', { method: 'POST', credentials: 'include' });
      setDone(true);
      setToken('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally { setBusy(false); }
  }

  return <main className='flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-slate-100'><div className='w-full max-w-md rounded-[2rem] border border-slate-700 bg-slate-900 p-7 shadow-2xl md:p-9'>
    <div className='flex items-center justify-between'><Link href='/' className='text-xs font-bold uppercase tracking-[0.22em] text-teal-300'>ESSAYCOACH</Link><button type='button' onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold'>{locale === 'en' ? '中文' : 'English'}</button></div>
    <h1 className='mt-8 text-3xl font-semibold tracking-tight'>{done ? t('ui.emailUpdated') : t('ui.confirmNewEmail')}</h1>
    {done ? <><p className='mt-4 text-sm leading-6 text-slate-300'>{t('ui.yourOldSessionsWereSignedOutSignInUsingThe')}</p><Link href='/auth/sign-in' className='mt-7 inline-block rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950'>{t('ui.goToSignIn')}</Link></> : email ? <><p className='mt-4 text-sm leading-6 text-slate-300'>{t('ui.confirmThisAddressForYourEssaycoachAccount')} <strong className='text-white'>{email}</strong></p><button type='button' disabled={busy} onClick={() => { void confirm(); }} className='mt-7 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50'>{busy ? t('ui.confirming') : t('ui.confirmEmail')}</button></> : checking ? <p className='mt-4 text-sm text-slate-300'>{t('ui.checkingYourVerificationLink')}</p> : null}
    {error && <p role='alert' className='mt-5 rounded-xl bg-rose-950 p-4 text-sm text-rose-100'>{error === 'Verification link is missing.' ? t(error, '缺少验证链接。') : error === 'Verification link is invalid.' ? t(error, '验证链接无效。') : error}</p>}
    <Link href='/auth/sign-in' className='mt-8 inline-block text-sm font-semibold text-teal-300 hover:underline'>{t('ui.backToSignIn')}</Link>
  </div></main>;
}
