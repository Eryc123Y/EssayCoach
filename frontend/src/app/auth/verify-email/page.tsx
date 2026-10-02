'use client';

import { localized } from '@/locales';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { emailChangeService } from '@/service/api/v2/email-change';
import { usePreferences } from '@/components/layout/preference-provider';
import { parseFragmentToken } from '@/lib/fragment-token';
import { clearUserData } from '@/lib/user-data-storage';

export default function VerifyEmailPage() {
  const { locale, applyLocale } = usePreferences();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const t = (en: string, zh?: string) => localized(locale, en, zh);

  useEffect(() => {
    const fragment = parseFragmentToken(window.location.hash);
    if (fragment.invalid) {
      setError('invalid');
      setChecking(false);
      return;
    }
    if (!fragment.token) {
      setError('missing');
      setChecking(false);
      return;
    }
    window.history.replaceState(null, '', window.location.pathname);
    setToken(fragment.token);
    emailChangeService
      .preview(fragment.token)
      .then((result) => {
        setEmail(result.new_email);
        setError('');
      })
      .catch(() => setError('invalid'))
      .finally(() => setChecking(false));
  }, []);

  async function confirm() {
    setBusy(true);
    try {
      await emailChangeService.complete(token);
      await fetch('/api/v2/auth/logout/', {
        method: 'POST',
        credentials: 'include'
      });
      clearUserData();
      setDone(true);
      setToken('');
      setError('');
    } catch {
      setError('failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className='flex min-h-screen items-center justify-center bg-slate-950 px-5 py-12 text-slate-100'>
      <div className='w-full max-w-md rounded-[2rem] border border-slate-700 bg-slate-900 p-7 shadow-2xl md:p-9'>
        <div className='flex items-center justify-between'>
          <Link
            href='/'
            className='text-xs font-bold tracking-[0.22em] text-teal-300 uppercase'
          >
            ESSAYCOACH
          </Link>
          <button
            type='button'
            onClick={() => applyLocale(locale === 'en' ? 'zh' : 'en')}
            className='rounded-full border border-slate-600 px-3 py-1 text-xs font-semibold'
            aria-label={t('ui.authSwitchLanguage')}
          >
            {locale === 'en' ? '中文' : 'English'}
          </button>
        </div>
        <h1 className='mt-8 text-3xl font-semibold tracking-tight'>
          {done ? t('ui.emailUpdated') : t('ui.confirmNewEmail')}
        </h1>
        {done ? (
          <>
            <p className='mt-4 text-sm leading-6 text-slate-300'>
              {t('ui.yourOldSessionsWereSignedOutSignInUsingThe')}
            </p>
            <Link
              href='/auth/sign-in'
              className='mt-7 inline-block rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950'
            >
              {t('ui.goToSignIn')}
            </Link>
          </>
        ) : email ? (
          <>
            <p className='mt-4 text-sm leading-6 text-slate-300'>
              {t('ui.confirmThisAddressForYourEssaycoachAccount')}{' '}
              <strong className='text-white'>{email}</strong>
            </p>
            <button
              type='button'
              disabled={busy}
              onClick={() => {
                void confirm();
              }}
              className='mt-7 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-50'
            >
              {busy ? t('ui.confirming') : t('ui.confirmEmail')}
            </button>
          </>
        ) : checking ? (
          <p className='mt-4 text-sm text-slate-300'>
            {t('ui.checkingYourVerificationLink')}
          </p>
        ) : null}
        {error && (
          <p
            role='alert'
            className='mt-5 rounded-xl bg-rose-950 p-4 text-sm text-rose-100'
          >
            {error === 'missing'
              ? t('ui.verificationLinkIsMissing')
              : error === 'invalid'
                ? t('ui.verificationLinkIsInvalid')
                : t('ui.authCouldNotVerifyEmail')}
          </p>
        )}
        <Link
          href='/auth/sign-in'
          className='mt-8 inline-block text-sm font-semibold text-teal-300 hover:underline'
        >
          {t('ui.backToSignIn')}
        </Link>
      </div>
    </main>
  );
}
