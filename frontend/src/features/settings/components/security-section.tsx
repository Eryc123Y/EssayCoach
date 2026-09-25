'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  IconDeviceDesktop,
  IconMapPin,
  IconClock,
  IconCheck,
  IconTrash,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { formatDistanceToNow } from 'date-fns';
import type { SessionInfo, LoginHistoryItem } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';
import { zhCN } from 'date-fns/locale';

interface SecuritySectionProps {
  sessions: SessionInfo[];
  isLoadingSessions: boolean;
  loginHistory: LoginHistoryItem[];
  isLoadingHistory: boolean;
  onRevokeSession: (sessionKey: string) => Promise<void>;
}

function formatDevice(device: string): string {
  if (device.includes('Windows')) return 'Windows PC';
  if (device.includes('Mac')) return 'Mac';
  if (device.includes('iPhone')) return 'iPhone';
  if (device.includes('Android')) return 'Android';
  if (device.includes('iPad')) return 'iPad';
  return device;
}

export function SecuritySection({
  sessions,
  isLoadingSessions,
  loginHistory,
  isLoadingHistory,
  onRevokeSession,
}: SecuritySectionProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const ago = (date: string) => formatDistanceToNow(new Date(date), { addSuffix: true, locale: locale === 'zh' ? zhCN : undefined });
  if (isLoadingSessions || isLoadingHistory) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Active sessions', '活跃会话')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('Login history', '登录记录')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-3 w-48 rounded bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('Active sessions', '活跃会话')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconDeviceDesktop className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t('No active sessions found', '暂无活跃会话')}</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.session_key}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                    <IconDeviceDesktop className="size-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {formatDevice(session.device)}
                      </p>
                      {session.is_current && (
                        <Badge variant="default" className="bg-green-500">
                          <IconCheck className="mr-1 size-3" />
                          {t('Current', '当前')}
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="size-3" />
                        {session.ip_address || t('Unknown location', '未知位置')}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        {ago(session.last_activity)}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRevokeSession(session.session_key)}
                    className="text-destructive hover:text-destructive"
                  >
                    <IconTrash className="mr-2 size-4" />
                    {t('Revoke', '撤销')}
                  </Button>
                )}
              </div>
            ))
          )}

          {sessions.length > 1 && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <IconAlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">{t('Security tip', '安全提示')}</p>
                <p>
                  {t('Revoke sessions you do not recognize. Your current session stays active.', '撤销不认识的会话；当前会话会保持登录。')}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('Login history', '登录记录')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          {loginHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconClock className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground">{t('No login history available', '暂无登录记录')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {loginHistory.slice(0, 10).map((login, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-8 items-center justify-center rounded-full ${
                        login.success
                          ? 'bg-green-100 dark:bg-green-900'
                          : 'bg-red-100 dark:bg-red-900'
                      }`}
                    >
                      {login.success ? (
                        <IconCheck className="size-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <IconAlertTriangle className="size-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {login.device || t('Unknown device', '未知设备')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {login.ip_address || t('Unknown IP', '未知 IP')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {ago(login.login_time)}
                    </p>
                    <p
                      className={`text-xs ${
                        login.success
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {login.success ? t('Success', '成功') : t('Failed', '失败')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
