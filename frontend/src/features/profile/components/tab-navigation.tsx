'use client';

import { cn } from '@/lib/utils';
import type { UserRole } from '@/components/layout/simple-auth-context';

export type TabId = 'essays' | 'achievements' | 'progress';

export interface Tab {
  id: TabId;
  label: string;
}

interface TabNavigationProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  userRole?: UserRole;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  userRole
}: TabNavigationProps) {
  const TABS: Tab[] = [
    { id: 'essays', label: 'Activity' },
    ...(userRole === 'student'
      ? [{ id: 'achievements', label: 'Achievements' } as Tab]
      : []),
    { id: 'progress', label: 'Progress' }
  ];

  return (
    <div className='border-b border-slate-200 dark:border-slate-700'>
      <nav className='flex gap-6' aria-label='Profile tabs'>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative py-4 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-indigo-600 dark:text-indigo-400'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            )}
            aria-current={activeTab === tab.id ? 'page' : undefined}
            aria-selected={activeTab === tab.id}
            role='tab'
          >
            {tab.label}
            {activeTab === tab.id && (
              <span
                className='absolute right-0 bottom-0 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400'
                aria-hidden='true'
              />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
