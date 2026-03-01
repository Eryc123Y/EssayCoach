'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { UserInfo } from '@/service/api/v2/types';
import { IconCalendar, IconUser } from '@tabler/icons-react';

interface ProfileHeaderProps {
  user: UserInfo;
  avatarUrl?: string | null;
  joinedDate?: string | null;
}

/**
 * Get role display name and color
 */
function getRoleInfo(role: string): { label: string; color: string } {
  switch (role) {
    case 'admin':
      return {
        label: 'Administrator',
        color: 'bg-red-100 text-red-700 border-red-200'
      };
    case 'lecturer':
      return {
        label: 'Lecturer',
        color: 'bg-indigo-100 text-indigo-700 border-indigo-200'
      };
    case 'student':
      return {
        label: 'Student',
        color: 'bg-emerald-100 text-emerald-700 border-emerald-200'
      };
    default:
      return {
        label: role,
        color: 'bg-slate-100 text-slate-700 border-slate-200'
      };
  }
}

/**
 * Get initials from user name
 */
function getInitials(
  firstName: string | null,
  lastName: string | null
): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || 'U';
}

/**
 * Profile Header Component
 *
 * Displays user avatar, name, role, bio, and join date
 */
export function ProfileHeader({
  user,
  avatarUrl,
  joinedDate
}: ProfileHeaderProps) {
  const roleInfo = getRoleInfo(user.user_role);
  const displayName =
    user.user_fname && user.user_lname
      ? `${user.user_fname} ${user.user_lname}`
      : user.user_fname || user.user_lname || user.user_email.split('@')[0];

  const formattedJoinDate = joinedDate
    ? new Date(joinedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      })
    : null;

  return (
    <Card className='border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm dark:border-slate-700 dark:from-slate-900 dark:to-slate-800'>
      <CardContent className='p-6 md:p-8'>
        <div className='flex flex-col items-start gap-6 sm:flex-row sm:items-center'>
          {/* Avatar */}
          <div className='flex-shrink-0'>
            <Avatar className='h-32 w-32 border-4 border-white shadow-lg dark:border-slate-700'>
              <AvatarImage src={avatarUrl || undefined} alt={displayName} />
              <AvatarFallback className='bg-gradient-to-br from-indigo-500 to-purple-600 text-2xl font-semibold text-white'>
                {getInitials(user.user_fname, user.user_lname)}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Info */}
          <div className='flex-1 space-y-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
              <h1 className='text-3xl font-bold text-slate-900 dark:text-white'>
                {displayName}
              </h1>
              <Badge
                variant='outline'
                className={`w-fit font-medium ${roleInfo.color}`}
              >
                {roleInfo.label}
              </Badge>
            </div>

            {/* Meta Info */}
            <div className='flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400'>
              <div className='flex items-center gap-2'>
                <IconUser className='h-4 w-4' />
                <span>{user.user_email}</span>
              </div>
              {formattedJoinDate && (
                <div className='flex items-center gap-2'>
                  <IconCalendar className='h-4 w-4' />
                  <span>Joined {formattedJoinDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
