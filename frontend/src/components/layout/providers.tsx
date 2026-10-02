'use client';
import React from 'react';
import { ActiveThemeProvider } from '../active-theme';
import { AuthProvider } from '@/components/layout/simple-auth-context';
import { BrandingProvider } from '@/components/layout/branding-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <BrandingProvider>
          <AuthProvider>{children}</AuthProvider>
        </BrandingProvider>
      </ActiveThemeProvider>
    </>
  );
}
