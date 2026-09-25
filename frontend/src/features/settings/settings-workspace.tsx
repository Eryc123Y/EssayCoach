'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { useSettings } from '@/features/settings/hooks/useSettings';
import { SettingsSidebar, type SettingsSection } from '@/features/settings/components/settings-sidebar';
import { AccountSection } from '@/features/settings/components/account-section';
import { SecuritySection } from '@/features/settings/components/security-section';
import { NotificationsSection } from '@/features/settings/components/notifications-section';
import { DisplaySection } from '@/features/settings/components/display-section';
import { OrganizationSection } from '@/features/settings/components/organization-section';
import { EmailChangeSection } from '@/features/settings/components/email-change-section';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserInfo } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';

export default function SettingsWorkspace() {
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const [currentSection, setCurrentSection] = useState<SettingsSection>('account');
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
    changePassword,
  } = useSettings();

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userInfo = await fetchUserInfo();
        if (userInfo) {
          setUser(userInfo);
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
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'account':
        return (
          <><AccountSection
            user={user}
            isLoading={isUserLoading}
            onSaveUser={handleSaveUser}
            onUploadAvatar={uploadAvatar}
            onChangePassword={changePassword}
          />{user && <EmailChangeSection currentEmail={user.user_email} />}</>
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
            userRole={user?.user_role === 'teacher' ? 'lecturer' : (user?.user_role as 'student' | 'lecturer' | 'admin') || 'student'}
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
      default:
        return null;
    }
  };

  const getSectionTitle = () => {
    const titles: Record<SettingsSection, string> = {
      account: t('Account settings', '账户设置'),
      security: t('Security settings', '安全设置'),
      notifications: t('Notification settings', '通知设置'),
      display: t('Display settings', '显示设置'),
      organization: t('Organization settings', '机构设置'),
    };
    return titles[currentSection];
  };

  if (isUserLoading) {
    return (
      <PageContainer>
        <div className="flex h-full gap-6">
          <div className="hidden w-64 flex-shrink-0 md:block">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="flex-1 space-y-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </PageContainer>
    );
  }

  const userRole = user?.user_role === 'teacher' ? 'lecturer' : (user?.user_role as 'student' | 'lecturer' | 'admin') || 'student';

  return (
    <PageContainer>
      <div className="flex flex-col space-y-6">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{t('Settings', '设置')}</h1>
          <p className="text-muted-foreground">
            {t('Manage your account and preferences.', '管理账户与个人偏好。')}
          </p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar Navigation */}
          <SettingsSidebar
            currentSection={currentSection}
            onSectionChange={setCurrentSection}
            userRole={userRole}
          />

          {/* Main Content */}
          <div className="min-w-0 flex-1 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">{getSectionTitle()}</h2>
              <p className="text-muted-foreground">
                {getSectionDescription(currentSection, locale)}
              </p>
            </div>

            {renderSection()}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}

function getSectionDescription(section: SettingsSection, locale: 'en' | 'zh'): string {
  const descriptions: Record<SettingsSection, [string, string]> = {
    account: ['Update your profile information and password.', '更新个人资料和密码。'],
    security: ['Manage your sessions and view login history.', '管理会话并查看登录记录。'],
    notifications: ['Choose how you receive notifications.', '选择通知的接收方式。'],
    display: ['Choose the interface language and appearance.', '选择界面语言和外观。'],
    organization: ['Manage institution branding and enrollment settings.', '管理机构品牌和加入设置。'],
  };
  return descriptions[section][locale === 'zh' ? 1 : 0];
}
