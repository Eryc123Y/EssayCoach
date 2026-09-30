'use client';

import { localized } from '@/locales';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  IconMail,
  IconBell,
  IconFile,
  IconClipboard,
} from '@tabler/icons-react';
import type { UserPreferences } from '@/service/api/v2/types';
import { toast } from 'sonner';
import { usePreferences } from '@/components/layout/preference-provider';


interface NotificationsSectionProps {
  preferences: UserPreferences | null;
  isLoading: boolean;
  isSaving: boolean;
  onUpdatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
  userRole: 'student' | 'lecturer' | 'admin';
}

export function NotificationsSection({
  preferences,
  isLoading,
  isSaving,
  onUpdatePreferences,
  userRole,
}: NotificationsSectionProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh?: string) => localized(locale, en, zh);
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('ui.notificationPreferences')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-muted" />
                  <div className="h-3 w-48 rounded bg-muted" />
                </div>
                <div className="h-6 w-11 rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPrefs = { ...preferences, ...localPrefs };

  const handleToggle = (key: keyof UserPreferences, value: boolean) => {
    setLocalPrefs((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdatePreferences(localPrefs);
      setLocalPrefs({});
      setHasChanges(false);
      toast.success(t('ui.notificationPreferencesUpdated'));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error(t('ui.couldNotUpdateNotificationPreferences'));
    }
  };

  const handleReset = () => {
    setLocalPrefs({});
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('ui.notificationPreferences')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <IconMail className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">{t('ui.emailNotifications')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('ui.emailAlertsAreSavedToTheLocalOutboxOrSent')}
                </p>
              </div>
            </div>
            <Switch
              checked={currentPrefs.email_notifications}
              onCheckedChange={(checked) =>
                handleToggle('email_notifications', checked)
              }
              disabled={isSaving}
            />
          </div>

          <Separator />

          {/* In-App Notifications */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <IconBell className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">{t('ui.inAppNotifications')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('ui.getNotifiedWithinTheApplication')}
                </p>
              </div>
            </div>
            <Switch
              checked={currentPrefs.in_app_notifications}
              onCheckedChange={(checked) =>
                handleToggle('in_app_notifications', checked)
              }
              disabled={isSaving}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-teal-100 dark:bg-teal-900">
                <IconBell className="size-5 text-teal-700 dark:text-teal-300" />
              </div>
              <div>
                <p className="font-medium">{t('ui.communityActivity')}</p>
                <p className="text-sm text-muted-foreground">{t('ui.likesCommentsAndPeerFeedbackOnYourSharedEssays')}</p>
              </div>
            </div>
            <Switch
              checked={currentPrefs.social_alerts ?? true}
              onCheckedChange={(checked) => handleToggle('social_alerts', checked)}
              disabled={isSaving}
            />
          </div>

          <Separator />

          {/* Role-specific toggles */}
          {userRole === 'student' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <IconFile className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{t('ui.submissionAlerts')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('ui.getNotifiedWhenYouReceiveFeedback')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={currentPrefs.submission_alerts}
                  onCheckedChange={(checked) =>
                    handleToggle('submission_alerts', checked)
                  }
                  disabled={isSaving}
                />
              </div>

              <Separator />
            </>
          )}

          {userRole === 'lecturer' && (
            <>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                    <IconClipboard className="size-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium">{t('ui.gradingAlerts')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('ui.getNotifiedWhenStudentsSubmitEssays')}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={currentPrefs.grading_alerts}
                  onCheckedChange={(checked) =>
                    handleToggle('grading_alerts', checked)
                  }
                  disabled={isSaving}
                />
              </div>

              <Separator />
            </>
          )}

        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('ui.saving83ad29') : t('ui.saveChanges')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              {t('ui.reset')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
