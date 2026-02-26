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
  IconCalendar,
} from '@tabler/icons-react';
import type { UserPreferences } from '@/service/api/v2/types';

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
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
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
    await onUpdatePreferences(localPrefs);
    setLocalPrefs({});
    setHasChanges(false);
  };

  const handleReset = () => {
    setLocalPrefs({});
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {/* Email Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <IconMail className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive email updates about your account
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <IconBell className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Get notified within the application
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

          {/* Role-specific toggles */}
          {userRole === 'student' && (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <IconFile className="size-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Submission Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when you receive feedback
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                    <IconClipboard className="size-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium">Grading Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when students submit essays
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

          {/* Weekly Digest */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                <IconCalendar className="size-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-muted-foreground">
                  Receive a weekly summary of activity
                </p>
              </div>
            </div>
            <Switch
              checked={currentPrefs.weekly_digest}
              onCheckedChange={(checked) =>
                handleToggle('weekly_digest', checked)
              }
              disabled={isSaving}
            />
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
