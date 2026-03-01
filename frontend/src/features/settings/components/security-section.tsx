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
  if (isLoadingSessions || isLoadingHistory) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
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
            <CardTitle>Login History</CardTitle>
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
            Active Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconDeviceDesktop className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground">No active sessions found</p>
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
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IconMapPin className="size-3" />
                        {session.ip_address || 'Unknown location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        {formatDistanceToNow(new Date(session.last_activity), {
                          addSuffix: true,
                        })}
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
                    Revoke
                  </Button>
                )}
              </div>
            ))
          )}

          {sessions.length > 1 && (
            <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <IconAlertTriangle className="mt-0.5 size-4 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium">Security Tip</p>
                <p>
                  Revoke sessions you do not recognize. You will remain logged
                  in on your current device.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Login History</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator className="mb-4" />
          {loginHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconClock className="mb-4 size-12 text-muted-foreground" />
              <p className="text-muted-foreground">No login history available</p>
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
                        {login.device || 'Unknown device'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {login.ip_address || 'Unknown IP'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDistanceToNow(new Date(login.login_time), {
                        addSuffix: true,
                      })}
                    </p>
                    <p
                      className={`text-xs ${
                        login.success
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      {login.success ? 'Success' : 'Failed'}
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
