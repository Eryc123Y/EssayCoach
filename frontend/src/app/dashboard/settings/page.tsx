'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { authService } from '@/service/api/v2/auth';
import { useSettings } from '@/features/settings/hooks/useSettings';
import {
  SettingsSidebar,
  type SettingsSection
} from '@/features/settings/components/settings-sidebar';
import { AccountSection } from '@/features/settings/components/account-section';
import { SecuritySection } from '@/features/settings/components/security-section';
import { NotificationsSection } from '@/features/settings/components/notifications-section';
import { DisplaySection } from '@/features/settings/components/display-section';
import { OrganizationSection } from '@/features/settings/components/organization-section';
import { ApiKeysSection } from '@/features/settings/components/api-keys-section';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { IconAlertCircle } from '@tabler/icons-react';
import type { UserInfo } from '@/service/api/v2/types';

export default function SettingsPage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] =
    useState<SettingsSection>('account');
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  const {
    preferences,
    isLoading,
    isSaving,
    sessions,
    isLoadingSessions,
    loginHistory,
    isLoadingHistory,
    updatePreferences,
    revokeSession,
    fetchUserInfo,
    updateUser,
    uploadAvatar,
    changePassword
  } = useSettings();

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = await fetchUserInfo();
        if (userInfo) {
          setUser(userInfo);
        } else {
          // Try to get from localStorage as fallback
          const stored = localStorage.getItem('user_data');
          if (stored) {
            const parsed = JSON.parse(stored);
            setUser({
              user_id: parseInt(parsed.id),
              user_email: parsed.email,
              user_fname: parsed.firstName,
              user_lname: parsed.lastName,
              user_role: parsed.role,
              is_active: true
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user info:', error);
      } finally {
        setIsUserLoading(false);
      }
    };

    loadUserInfo();
  }, [fetchUserInfo]);

  const handleSaveUser = async (data: {
    user_fname: string;
    user_lname: string;
    user_email: string;
  }) => {
    await updateUser(data);
    // Refresh user info after update
    const updatedUser = await fetchUserInfo();
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          id: updatedUser.user_id,
          email: updatedUser.user_email,
          firstName: updatedUser.user_fname,
          lastName: updatedUser.user_lname,
          role: updatedUser.user_role
        })
      );
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'account':
        return (
          <AccountSection
            user={user}
            isLoading={isUserLoading}
            onSaveUser={handleSaveUser}
            onUploadAvatar={uploadAvatar}
            onChangePassword={changePassword}
          />
        );
      case 'security':
        return (
          <SecuritySection
            sessions={sessions}
            isLoadingSessions={isLoadingSessions}
            loginHistory={loginHistory}
            isLoadingHistory={isLoadingHistory}
            onRevokeSession={revokeSession}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection
            preferences={preferences}
            isLoading={isLoading}
            isSaving={isSaving}
            onUpdatePreferences={updatePreferences}
            userRole={
              user?.user_role === 'teacher'
                ? 'lecturer'
                : (user?.user_role as 'student' | 'lecturer' | 'admin') ||
                  'student'
            }
          />
        );
      case 'display':
        return (
          <DisplaySection
            preferences={preferences}
            isLoading={isLoading}
            isSaving={isSaving}
            onUpdatePreferences={updatePreferences}
          />
        );
      case 'organization':
        return <OrganizationSection />;
      case 'api':
        return <ApiKeysSection />;
      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<SettingsSection, string> = {
      account: 'Account Settings',
      security: 'Security Settings',
      notifications: 'Notification Settings',
      display: 'Display Settings',
      organization: 'Organization Settings',
      api: 'API Keys'
    };
    return titles[currentSection];
  };

  if (isUserLoading) {
    return (
      <PageContainer>
        <div className='flex h-full gap-6'>
          <div className='hidden w-64 flex-shrink-0 md:block'>
            <Skeleton className='h-full w-full' />
          </div>
          <div className='flex-1 space-y-6'>
            <Skeleton className='h-8 w-48' />
            <Skeleton className='h-64 w-full' />
          </div>
        </div>
      </PageContainer>
    );
  }

  const userRole =
    user?.user_role === 'teacher'
      ? 'lecturer'
      : (user?.user_role as 'student' | 'lecturer' | 'admin') || 'student';

  return (
    <PageContainer>
      <div className='flex flex-col space-y-6'>
        {/* Page Header */}
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground'>
            Manage your account preferences and settings.
          </p>
        </div>

        {/* Alert for incomplete features */}
        {userRole !== 'admin' && (
          <Alert variant='default'>
            <IconAlertCircle className='size-4' />
            <AlertDescription>
              Organization and API settings are only available for
              administrators.
            </AlertDescription>
          </Alert>
        )}

        <div className='flex gap-6'>
          {/* Sidebar Navigation */}
          <SettingsSidebar
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            userRole={userRole}
          />

          {/* Main Content */}
          <div className='flex-1 space-y-6'>
            <div className='space-y-2'>
              <h2 className='text-2xl font-semibold'>{getSectionTitle()}</h2>
              <p className='text-muted-foreground'>
                {getSectionDescription(currentSection)}
              </p>
            </div>

            {renderSection()}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function getSectionDescription(section: SettingsSection): string {
  const descriptions: Record<SettingsSection, string> = {
    account: 'Update your profile information and change your password.',
    security: 'Manage your active sessions and view login history.',
    notifications: 'Configure how and when you receive notifications.',
    display: 'Customize the appearance and language of the application.',
    organization: 'Manage organization branding and user management settings.',
    api: 'Create and manage API keys for programmatic access.'
  };
  return descriptions[section];
}
