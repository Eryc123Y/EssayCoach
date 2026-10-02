'use client';

import Link from 'next/link';
import { BrandMark, BrandName } from '@/components/layout/brand-mark';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { localized } from '@/locales';
import { usePreferences } from '@/components/layout/preference-provider';

type Preview = {
  email: string;
  role: 'student' | 'lecturer';
  class_name: string | null;
  unit_name: string | null;
  expires_at: string;
};

const fieldClass =
  'mt-2 w-full rounded-xl border border-[#D8DEEA] bg-white px-4 py-3 text-[#19243B] outline-none focus:border-[#365CE6] focus:ring-2 focus:ring-[#365CE6]/15';

export default function SignUpViewPage() {
  const router = useRouter();
  const { locale, applyLocale } = usePreferences();
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<'short' | 'mismatch' | 'activation' | ''>(
    ''
  );
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const t = (id: string) => localized(locale, id);

  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const invitationToken = fragment.get('token') || query.get('token');
    setToken(invitationToken);
    if (invitationToken)
      window.history.replaceState(null, '', window.location.pathname);
    if (!invitationToken) {
      setChecking(false);
      return;
    }
    fetch('/api/v2/auth/invitations/preview/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ token: invitationToken })
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        return (await response.json()) as Preview;
      })
      .then(setPreview)
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false));
  }, []);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !preview) return;
    if (password.length < 8) return setError('short');
    if (password !== confirm) return setError('mismatch');
    setWorking(true);
    setError('');
    try {
      const response = await fetch('/api/v2/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          invitation_token: token,
          first_name: first,
          last_name: last,
          password,
          password_confirm: confirm
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          result?.message || t('ui.authInvitationActivationFailed')
        );
      if (result.user) {
        localStorage.setItem(
          'user_data',
          JSON.stringify({
            id: String(result.user.user_id || result.user.id),
            email: result.user.user_email || result.user.email,
            firstName: result.user.user_fname || result.user.first_name || '',
            lastName: result.user.user_lname || result.user.last_name || '',
            role: result.user.user_role || result.user.role
          })
        );
        window.dispatchEvent(new Event('essaycoach:user-updated'));
      }
      toast.success(t('ui.authInvitationActivated'));
      router.replace('/dashboard');
    } catch {
      setError('activation');
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className='min-h-screen bg-[#F5F7FB] px-5 py-7 text-[#19243B] sm:px-8'>
      <div className='mx-auto max-w-5xl'>
        <header className='flex items-center justify-between border-b border-[#DFE5EF] pb-5'>
          <Link
            href='/'
            className='flex items-center gap-3 text-xl font-semibold tracking-tight'
          >
            <BrandMark />
            <BrandName />
          </Link>
          <button
            type='button'
            onClick={() => applyLocale(locale === 'en' ? 'zh' : 'en')}
            className='rounded-lg border border-[#D8DEEA] bg-white px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[#365CE6]'
            aria-label={t('ui.authSwitchLanguage')}
          >
            {locale === 'en' ? '中文' : 'English'}
          </button>
        </header>
        <div className='grid gap-10 py-12 md:grid-cols-[1fr_430px] md:gap-16 md:py-20'>
          <section className='max-w-lg pt-2'>
            <h1 className='text-4xl leading-tight font-semibold tracking-tight sm:text-5xl'>
              {preview?.role === 'lecturer'
                ? t('ui.authLecturerInvitationTitle')
                : t('ui.authStudentInvitationTitle')}
            </h1>
            <p className='mt-5 max-w-md text-base leading-8 text-[#59657C]'>
              {preview?.role === 'lecturer'
                ? t('ui.authLecturerInvitationIntro')
                : preview
                  ? t('ui.authStudentInvitationIntro')
                  : t('ui.authInvitationMissingIntro')}
            </p>
          </section>
          <section className='rounded-2xl border border-[#DFE5EF] bg-white p-6 shadow-[0_14px_45px_rgba(25,36,59,0.04)] sm:p-8'>
            <h2 className='text-xl font-semibold'>
              {t('ui.authYourInvitation')}
            </h2>
            {checking ? (
              <p className='mt-6 text-[#59657C]' role='status'>
                {t('ui.authCheckingInvitation')}
              </p>
            ) : !token || invalid || !preview ? (
              <p
                className='mt-6 rounded-xl bg-[#F5F7FB] p-4 leading-7 text-[#59657C]'
                role='alert'
              >
                {invalid
                  ? t('ui.authInvitationInvalid')
                  : t('ui.authInvitationMissing')}
              </p>
            ) : (
              <>
                <div className='mt-6 rounded-xl border border-[#DFE5EF] bg-[#F5F7FB] p-4'>
                  <p className='font-medium'>{preview.email}</p>
                  <p className='mt-1 text-sm text-[#59657C]'>
                    {preview.role === 'student'
                      ? t('ui.student')
                      : t('ui.lecturer')}
                    {preview.class_name
                      ? ` · ${t('ui.class')}: ${preview.class_name}`
                      : ''}
                    {preview.unit_name
                      ? ` · ${t('ui.authCourseLeadFor')}: ${preview.unit_name}`
                      : ''}
                  </p>
                  <p className='mt-2 text-xs text-[#718098]'>
                    {t('ui.authExpires')}{' '}
                    {new Date(preview.expires_at).toLocaleDateString(
                      locale === 'zh' ? 'zh-CN' : 'en-US'
                    )}
                  </p>
                </div>
                <form className='mt-6 space-y-4' onSubmit={activate}>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    <label className='block text-sm font-medium'>
                      {t('ui.firstName')}
                      <input
                        className={fieldClass}
                        value={first}
                        onChange={(event) => setFirst(event.target.value)}
                        autoComplete='given-name'
                        maxLength={20}
                      />
                    </label>
                    <label className='block text-sm font-medium'>
                      {t('ui.lastName')}
                      <input
                        className={fieldClass}
                        value={last}
                        onChange={(event) => setLast(event.target.value)}
                        autoComplete='family-name'
                        maxLength={20}
                      />
                    </label>
                  </div>
                  <label className='block text-sm font-medium'>
                    {t('ui.password')}
                    <input
                      className={fieldClass}
                      type='password'
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete='new-password'
                      required
                      minLength={8}
                    />
                  </label>
                  <p className='text-xs leading-5 text-[#718098]'>
                    {t('ui.authInvitationPasswordHint')}
                  </p>
                  <label className='block text-sm font-medium'>
                    {t('ui.confirmPassword')}
                    <input
                      className={fieldClass}
                      type='password'
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      autoComplete='new-password'
                      required
                      minLength={8}
                    />
                  </label>
                  {error && (
                    <p
                      className='rounded-lg bg-red-50 p-3 text-sm text-red-700'
                      role='alert'
                    >
                      {error === 'short'
                        ? t('ui.passwordMustBeAtLeast8Characters')
                        : error === 'mismatch'
                          ? t('ui.passwordsDoNotMatch')
                          : t('ui.authInvitationActivationFailed')}
                    </p>
                  )}
                  <button
                    type='submit'
                    disabled={working}
                    className='w-full rounded-xl bg-[#365CE6] px-4 py-3 font-medium text-white transition hover:bg-[#2949C5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365CE6] disabled:opacity-60'
                  >
                    {working
                      ? t('ui.authActivatingInvitation')
                      : t('ui.authActivateInvitation')}
                  </button>
                </form>
              </>
            )}
            <Link
              href='/auth/sign-in'
              className='mt-7 inline-block text-sm font-medium text-[#365CE6] hover:underline'
            >
              {t('ui.authAlreadyHaveAccess')}
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
