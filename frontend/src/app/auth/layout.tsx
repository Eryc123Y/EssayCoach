'use client';

import { PreferenceProvider } from '@/components/layout/preference-provider';

export default function AuthLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Authentication screens are available before an account can have saved preferences.
  // They share the existing locale context, without requesting protected settings.
  return (
    <PreferenceProvider hasInitialPreferences>{children}</PreferenceProvider>
  );
}
