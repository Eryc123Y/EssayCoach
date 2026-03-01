'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import type { Badge as BadgeType } from '@/service/api/v2/types';
import {
  IconAward,
  IconTrophy,
  IconStar,
  IconMedal,
  IconTarget,
  IconBolt,
  IconBook,
  IconPencil
} from '@tabler/icons-react';

interface ProfileAchievementsTabProps {
  badges: BadgeType[];
}

/**
 * Get icon component by name
 */
function getIconComponent(icon: string | null) {
  const iconMap: Record<string, React.ComponentType<{ className: string }>> = {
    trophy: IconTrophy,
    star: IconStar,
    medal: IconMedal,
    target: IconTarget,
    zap: IconBolt,
    book: IconBook,
    pen: IconPencil,
    'icon-essay': IconPencil,
    'icon-pencil': IconPencil
  };

  return iconMap[icon || ''] || IconAward;
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Get badge color by name pattern
 */
function getBadgeColor(name: string): string {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('first') || lowerName.includes('beginner')) {
    return 'from-emerald-400 to-emerald-600';
  }
  if (lowerName.includes('prolific') || lowerName.includes('writer')) {
    return 'from-blue-400 to-blue-600';
  }
  if (lowerName.includes('excellent') || lowerName.includes('top')) {
    return 'from-amber-400 to-amber-600';
  }
  if (lowerName.includes('master') || lowerName.includes('expert')) {
    return 'from-purple-400 to-purple-600';
  }
  if (lowerName.includes('improvement') || lowerName.includes('progress')) {
    return 'from-rose-400 to-rose-600';
  }
  return 'from-slate-400 to-slate-600';
}

/**
 * Mock badges for demonstration when no badges are available
 */
const MOCK_BADGES: BadgeType[] = [
  {
    id: 1,
    name: 'First Essay',
    description: 'Submitted your first essay',
    icon: 'pen',
    earned_at: '2025-01-15T10:00:00Z'
  },
  {
    id: 2,
    name: 'Prolific Writer',
    description: 'Submitted 10 essays',
    icon: 'book',
    earned_at: '2025-02-01T14:30:00Z'
  },
  {
    id: 3,
    name: 'Excellent Score',
    description: 'Achieved 90% or above on an essay',
    icon: 'star',
    earned_at: '2025-02-10T09:15:00Z'
  },
  {
    id: 4,
    name: 'Improvement Award',
    description: 'Improved score by 10% or more',
    icon: 'trending-up',
    earned_at: '2025-02-15T16:45:00Z'
  },
  {
    id: 5,
    name: 'Consistency Champion',
    description: 'Submitted essays for 4 consecutive weeks',
    icon: 'medal',
    earned_at: '2025-02-20T11:20:00Z'
  }
];

/**
 * Profile Achievements Tab Component
 *
 * Displays user's earned badges in a badge wall format
 */
export function ProfileAchievementsTab({
  badges
}: ProfileAchievementsTabProps) {
  const displayBadges = badges.length > 0 ? badges : MOCK_BADGES;

  return (
    <Card className='border-slate-200 dark:border-slate-700'>
      <CardHeader>
        <CardTitle className='text-lg'>Achievements & Badges</CardTitle>
        <p className='text-sm text-slate-500'>
          {displayBadges.length} badge{displayBadges.length !== 1 ? 's' : ''}{' '}
          earned
        </p>
      </CardHeader>
      <CardContent>
        {displayBadges.length === 0 ? (
          <div className='py-12 text-center text-slate-500'>
            <IconAward className='mx-auto mb-4 h-16 w-16 opacity-50' />
            <p className='text-lg font-medium'>No badges earned yet</p>
            <p className='mt-1 text-sm'>
              Keep submitting essays to earn achievements!
            </p>
          </div>
        ) : (
          <TooltipProvider>
            <div className='grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'>
              {displayBadges.map((badge) => {
                const IconComponent = getIconComponent(badge.icon);
                const gradient = getBadgeColor(badge.name);

                return (
                  <Tooltip key={badge.id}>
                    <TooltipTrigger asChild>
                      <div className='group flex cursor-pointer flex-col items-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-4 transition-all hover:from-slate-100 hover:to-slate-200 dark:from-slate-800 dark:to-slate-700 dark:hover:from-slate-700 dark:hover:to-slate-600'>
                        <div
                          className={`h-14 w-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md transition-shadow group-hover:shadow-lg`}
                        >
                          <IconComponent className='h-7 w-7 text-white' />
                        </div>
                        <h4 className='mt-3 line-clamp-2 text-center text-xs font-medium text-slate-900 dark:text-white'>
                          {badge.name}
                        </h4>
                        {badge.earned_at && (
                          <p className='mt-1 text-[10px] text-slate-500'>
                            {formatDate(badge.earned_at)}
                          </p>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side='top' className='max-w-xs'>
                      <div className='text-center'>
                        <p className='font-semibold'>{badge.name}</p>
                        <p className='mt-1 text-sm text-slate-500'>
                          {badge.description}
                        </p>
                        {badge.earned_at && (
                          <p className='mt-2 text-xs text-slate-400'>
                            Earned on {formatDate(badge.earned_at)}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
