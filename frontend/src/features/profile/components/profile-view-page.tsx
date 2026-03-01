'use client';

import { useState } from 'react';
import { useAuth } from '@/components/layout/simple-auth-context';
import { useProfile } from '../hooks/useProfile';
import { ProfileHeader } from './profile-header';
import { ProfileStats } from './profile-stats';
import { TabNavigation, type TabId } from './tab-navigation';
import { ProfileEssaysTab } from './profile-essays-tab';
import { ProfileAchievementsTab } from './profile-achievements-tab';
import { ProfileProgressTab } from './profile-progress-tab';

/**
 * Profile View Container Component
 *
 * Main container that orchestrates all profile sub-components:
 * - Profile Header (avatar, name, role, bio)
 * - Stats Cards (total essays, avg score, badges)
 * - Tab Navigation (Essays, Achievements, Progress)
 * - Tab Content Panels
 */
export default function ProfileViewPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('essays');

  // Fetch profile data using the useProfile hook
  const { stats, badges, progress, loading, error } = useProfile(
    user?.id ? parseInt(user.id, 10) : 0,
    { enabled: !!user?.id }
  );

  // Loading state
  if (loading) {
    return (
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-8'>
        {/* Header Skeleton */}
        <div className='flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12 dark:border-slate-800 dark:bg-slate-900/50'>
          <div className='h-10 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
          <div className='h-5 w-96 animate-pulse rounded bg-slate-200 dark:bg-slate-700' />
        </div>

        {/* Stats Skeleton */}
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-28 animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
            />
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className='h-12 animate-pulse rounded bg-slate-100 dark:bg-slate-800' />

        {/* Content Skeleton */}
        <div className='space-y-4'>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className='h-24 animate-pulse rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-8'>
        <div className='rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400'>
          <h2 className='mb-2 text-lg font-semibold'>Failed to load profile</h2>
          <p>{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-8'>
      {/* Profile Header */}
      {user && (
        <ProfileHeader
          user={{
            user_id: user.id ? parseInt(user.id, 10) : 0,
            user_email: user.email,
            user_fname: user.firstName,
            user_lname: user.lastName,
            user_role: user.role,
            is_active: true
          }}
          avatarUrl={null}
        />
      )}

      {/* Stats Cards */}
      <ProfileStats stats={stats} badgeCount={badges.length} />

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        userRole={user?.role}
      />

      {/* Tab Content */}
      <div className='mt-4'>
        {activeTab === 'essays' && <ProfileEssaysTab stats={stats} />}
        {activeTab === 'achievements' && user?.role === 'student' && (
          <ProfileAchievementsTab badges={badges} />
        )}
        {activeTab === 'progress' && <ProfileProgressTab progress={progress} />}
      </div>
    </div>
  );
}
