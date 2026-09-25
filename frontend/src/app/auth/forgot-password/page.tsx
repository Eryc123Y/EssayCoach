'use client';

import { localized } from '@/locales';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { passwordResetService } from '@/service/api/v2/password-reset';

export default function ForgotPasswordPage() {
  const [language, setLanguage] = useState<'en' | 'zh'>('en');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const t = (en: string, zh?: string) => localized(language, en, zh);

  useEffect(() => {
    const hash = window.location.hash;
    const value = hash.startsWith('#token=') ? decodeURIComponent(hash.slice(7)) : '';
    if (!value) return;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setToken(value);
    passwordResetService.preview(value)
      .then((result) => { setEmail(result.email); setError(''); })
      .catch(() => setError('This reset link is invalid or expired. Ask an administrator for a new link.'));
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) { setError(t('ui.passwordsDoNotMatch')); return; }
    setLoading(true);
    try {
      await passwordResetService.complete(token, password, confirmation);
      setDone(true);
      setToken('');
      setPassword('');
      setConfirmation('');
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('ui.couldNotResetPassword'));
    } finally {
      setLoading(false);
    }
  }

  return <main className='flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-slate-100'>
    <div className='w-full max-w-md rounded-[2rem] border border-slate-700 bg-slate-900 p-7 shadow-2xl md:p-9'>
      <div className='flex items-start justify-between gap-4'><Link href='/' className='text-xs font-bold uppercase tracking-[0.22em] text-teal-300'>ESSAYCOACH</Link><button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold'>{language === 'en' ? '中文' : 'English'}</button></div>
      <h1 className='mt-8 text-3xl font-semibold tracking-tight'>{done ? t('ui.passwordUpdated') : t('ui.resetYourPassword')}</h1>
      {done ? <><p className='mt-3 text-sm leading-6 text-slate-300'>{t('ui.yourOldSessionsHaveBeenSignedOutUseYourNew')}</p><Link href='/auth/sign-in' className='mt-7 inline-block rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950'>{t('ui.goToSignIn')}</Link></> : token && email ? <><p className='mt-3 text-sm leading-6 text-slate-300'>{t('ui.setANewPasswordFor')} <strong className='text-white'>{email}</strong></p><form onSubmit={submit} className='mt-7 space-y-4'><label className='block text-sm font-semibold'>{t('ui.newPassword')}<input type='password' autoComplete='new-password' required minLength={8} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className='mt-2 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-teal-300' /></label><label className='block text-sm font-semibold'>{t('ui.confirmPassword')}<input type='password' autoComplete='new-password' required minLength={8} maxLength={128} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className='mt-2 w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none focus:border-teal-300' /></label><button disabled={loading} className='rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50'>{loading ? t('ui.updating') : t('ui.updatePassword')}</button></form></> : <p className='mt-4 text-sm leading-6 text-slate-300'>{t('ui.askYourInstitutionAdministratorForAOneTimePasswordReset')}</p>}
      {error && <p role='alert' className='mt-5 rounded-xl bg-rose-950 p-4 text-sm text-rose-100'>{error}</p>}
      <Link href='/auth/sign-in' className='mt-8 inline-block text-sm font-semibold text-teal-300 hover:underline'>{t('ui.backToSignIn')}</Link>
    </div>
  </main>;
}
