import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { PreferenceProvider } from '@/components/layout/preference-provider';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getServerApiUrl } from '@/lib/server-api';

export const metadata: Metadata = {
  title: 'EssayCoach Dashboard',
  description: 'Role-based dashboard for essay analysis and classroom workflows'
};

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  const token = cookieStore.get('access_token')?.value;
  let initialLocale: 'en' | 'zh' = 'en';
  let initialTheme: 'light' | 'dark' | 'system' = 'system';
  let hasInitialPreferences = false;
  if (token) {
    try {
      const response = await fetch(`${getServerApiUrl()}/api/v2/auth/settings/preferences/`, {
        headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
      });
      if (response.ok) {
        const payload = await response.json();
        hasInitialPreferences = true;
        initialLocale = payload.data?.language === 'zh' ? 'zh' : 'en';
        initialTheme = ['light', 'dark', 'system'].includes(payload.data?.theme) ? payload.data.theme : 'system';
      }
    } catch { /* The client can retry after the page loads. */ }
  }
  return (
    <PreferenceProvider initialLocale={initialLocale} initialTheme={initialTheme} hasInitialPreferences={hasInitialPreferences}><KBar>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className='flex h-svh flex-col'>
          <Header />
          {/* page main content */}
          <div className='flex-1 overflow-y-auto'>{children}</div>
          {/* page main content ends */}
        </SidebarInset>
      </SidebarProvider>
    </KBar></PreferenceProvider>
  );
}
