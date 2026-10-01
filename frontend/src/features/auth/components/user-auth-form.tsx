'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import * as z from 'zod';
import { localized } from '@/locales';
import { usePreferences } from '@/components/layout/preference-provider';
import { safeInternalCallbackUrl } from '../auth-navigation';

type UserFormValue = { email: string; password: string };

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');
  const { locale } = usePreferences();
  const t = (id: string) => localized(locale, id);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const defaultValues = { email: '', password: '' };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(
      z.object({
        email: z.string().email({ message: t('ui.authEnterValidEmail') }),
        password: z.string().min(1, { message: t('ui.authPasswordRequired') })
      })
    ),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);
    try {
      const response = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password, remember: rememberMe })
      });
      if (!response.ok) {
        if (response.status === 429) {
          toast.error(t('ui.authTooManyAttemptsWait'));
          return;
        }
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Request failed');
      }

      // Get the response data including user info
      const result = await response.json();

      // Store user data in localStorage for auth context
      if (result.user) {
        const userData = {
          id: String(result.user.id || result.user.user_id),
          email: result.user.email || result.user.user_email,
          firstName: result.user.first_name || result.user.user_fname || '',
          lastName: result.user.last_name || result.user.user_lname || '',
          role: (result.user.role || result.user.user_role || 'student') as
            | 'student'
            | 'lecturer'
            | 'admin'
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
        window.dispatchEvent(new Event('essaycoach:user-updated'));
      }

      toast.success(t('ui.authSignedInSuccessfully'));
      router.replace(safeInternalCallbackUrl(callbackUrl));
    } catch {
      toast.error(t('ui.authSignInFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-5'
        >
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <FormLabel className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                  {t('ui.authEmailAddress')}
                </FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder={t('ui.authEmailPlaceholder')}
                    disabled={loading}
                    className='h-11 border-slate-200 bg-white px-4 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950'
                    {...field}
                  />
                </FormControl>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <FormLabel className='text-sm font-medium text-slate-700 dark:text-slate-300'>
                    {t('ui.password')}
                  </FormLabel>
                  <Link
                    href='/auth/forgot-password'
                    className='text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400'
                  >
                    {t('ui.authForgotPassword')}
                  </Link>
                </div>
                <div className='relative'>
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      autoComplete='current-password'
                      disabled={loading}
                      className='h-11 border-slate-200 bg-white px-4 py-2 pr-11 text-sm transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:border-slate-800 dark:bg-slate-950'
                      {...field}
                    />
                  </FormControl>
                  <button
                    type='button'
                    aria-label={t(showPassword ? 'ui.authHidePassword' : 'ui.authShowPassword')}
                    aria-pressed={showPassword}
                    disabled={loading}
                    onClick={() => setShowPassword((visible) => !visible)}
                    className='absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800 disabled:cursor-not-allowed dark:hover:text-slate-200'
                  >
                    {showPassword ? <EyeOff size={18} aria-hidden='true' /> : <Eye size={18} aria-hidden='true' />}
                  </button>
                </div>
                <FormMessage className='text-xs' />
              </FormItem>
            )}
          />

          <label className='flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300'>
            <input
              type='checkbox'
              checked={rememberMe}
              disabled={loading}
              onChange={(event) => setRememberMe(event.target.checked)}
              className='size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500'
            />
            {t('ui.authRememberMe')}
          </label>

          <Button
            disabled={loading}
            className='h-11 w-full bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-2'
            type='submit'
          >
            {loading ? (
              <span className='flex items-center justify-center gap-2'>
                <svg className='h-4 w-4 animate-spin' viewBox='0 0 24 24'>
                  <circle
                    className='opacity-25'
                    cx='12'
                    cy='12'
                    r='10'
                    stroke='currentColor'
                    strokeWidth='4'
                    fill='none'
                  />
                  <path
                    className='opacity-75'
                    fill='currentColor'
                    d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                  />
                </svg>
                {t('ui.authSigningIn')}
              </span>
            ) : (
              t('ui.authSignIn')
            )}
          </Button>
        </form>
      </Form>

      <p className='mt-4 text-center text-sm text-slate-600 dark:text-slate-400'>
        {t('ui.authHaveInvitation')}{' '}
        <Link
          href='/auth/sign-up'
          className='font-medium text-blue-600 underline-offset-4 transition-colors hover:text-blue-700 hover:underline dark:text-blue-400'
        >
          {t('ui.authActivateAccount')}
        </Link>
      </p>
    </>
  );
}
