'use client';

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
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('Notification preferences', '通知偏好')}</CardTitle>
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
      toast.success(t('Notification preferences updated', '通知偏好已更新'));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error(t('Could not update notification preferences', '无法更新通知偏好'));
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
          {t('Notification preferences', '通知偏好')}
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
                <p className="font-medium">{t('Email notifications', '邮件通知')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('Email alerts are saved to the local outbox, or sent through configured SMTP.', '邮件提醒会保存到本地发件箱，或通过配置的 SMTP 发送。')}
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
                <p className="font-medium">{t('In-app notifications', '站内通知')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('Get notified within the application', '在应用内接收提醒')}
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
                <p className="font-medium">{t('Community activity', '社区互动')}</p>
                <p className="text-sm text-muted-foreground">{t('Likes, comments and peer feedback on your shared essays', '收到点赞、评论和同伴反馈时提醒我')}</p>
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
                    <p className="font-medium">{t('Submission alerts', '提交提醒')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Get notified when you receive feedback', '收到反馈时通知我')}
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
                    <p className="font-medium">{t('Grading alerts', '评分提醒')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('Get notified when students submit essays', '学生提交作文时通知我')}
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
              {isSaving ? t('Saving…', '保存中…') : t('Save changes', '保存更改')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              {t('Reset', '重置')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
