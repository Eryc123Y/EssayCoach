'use client';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import UserAuthForm from './user-auth-form';
import Link from 'next/link';
import { BrandMark, BrandName } from '@/components/layout/brand-mark';
import { localized } from '@/locales';
import { usePreferences } from '@/components/layout/preference-provider';

export default function SignInViewPage() {
  const { locale, applyLocale } = usePreferences();
  const t = (id: string) => localized(locale, id);
  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 z-50 hover:bg-slate-100 md:top-8 md:right-8 dark:hover:bg-slate-800'
        )}
      >
        {t('ui.authHome')}
      </Link>
      {/* Branding Panel - Modern Minimal with subtle gradient */}
      <div className='relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' />
        {/* Subtle pattern overlay */}
        <div
          className='absolute inset-0 opacity-[0.03]'
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}
        />
        <div className='relative z-10 flex items-center gap-3 text-xl font-semibold tracking-tight'>
          <BrandMark className='h-8 w-8 rounded-lg' iconSize={18} />
          <BrandName />
        </div>
        <div className='relative z-10 mt-auto'>
          <blockquote className='space-y-4'>
            <p className='text-2xl leading-tight font-medium'>
              {t('ui.authPlatformDescription')}
            </p>
            <p className='text-sm text-slate-400'>
              {t('ui.authPlatformIntro')}
            </p>
          </blockquote>
          {/* Feature bullets */}
          <div className='mt-8 space-y-3 text-sm text-slate-400'>
            <div className='flex items-center gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400'>
                <svg
                  className='h-3 w-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <span>{t('ui.authInstantEssayAnalysis')}</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400'>
                <svg
                  className='h-3 w-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <span>{t('ui.authPersonalizedRubrics')}</span>
            </div>
            <div className='flex items-center gap-3'>
              <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-400'>
                <svg
                  className='h-3 w-3'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <span>{t('ui.authTrackProgress')}</span>
            </div>
          </div>
        </div>
        {/* Footer */}
        <div className='relative z-10 mt-auto pt-8 text-xs text-slate-400'>
          © 2026 <BrandName />. {t('ui.authAllRightsReserved')}
        </div>
      </div>
      {/* Form Panel */}
      <div className='flex h-full items-center justify-center bg-white p-6 lg:p-12 dark:bg-slate-950'>
        <div className='flex w-full max-w-md flex-col justify-center space-y-8'>
          {/* Mobile header */}
          <div className='flex items-center gap-3 lg:hidden'>
            <BrandMark className='h-10 w-10 shadow-lg' iconSize={22} />
            <BrandName className='text-xl font-semibold' />
          </div>

          <div>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50'>
                  {t('ui.authWelcomeBack')}
                </h1>
                <p className='mt-2 text-sm text-slate-600 dark:text-slate-400'>
                  {t('ui.authSignInIntro')}
                </p>
              </div>
              <button
                type='button'
                onClick={() => applyLocale(locale === 'en' ? 'zh' : 'en')}
                className='rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-900'
                aria-label={t('ui.authSwitchLanguage')}
              >
                {locale === 'en' ? '中文' : 'English'}
              </button>
            </div>
          </div>

          <UserAuthForm />
        </div>
      </div>
    </div>
  );
}
