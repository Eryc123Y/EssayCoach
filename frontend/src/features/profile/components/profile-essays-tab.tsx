'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IconFile, IconCalendar, IconTrendingUp } from '@tabler/icons-react';
import type { UserStats } from '@/service/api/v2/types';

interface EssayListItem {
  id: number;
  title: string;
  score: number | null;
  submittedAt: string;
  status: string;
}

interface ProfileEssaysTabProps {
  stats: UserStats | null;
  essays?: EssayListItem[];
}

/**
 * Format date to readable string
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Get status badge variant
 */
function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' {
  switch (status) {
    case 'submitted':
      return 'default';
    case 'graded':
      return 'secondary';
    case 'draft':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Mock essay data for demonstration
 * In production, this would come from API
 */
const MOCK_ESSAYS: EssayListItem[] = [
  {
    id: 1,
    title: 'The Impact of Technology on Education',
    score: 85,
    submittedAt: '2025-02-20T10:00:00Z',
    status: 'graded',
  },
  {
    id: 2,
    title: 'Climate Change: Causes and Solutions',
    score: 78,
    submittedAt: '2025-02-15T14:30:00Z',
    status: 'graded',
  },
  {
    id: 3,
    title: 'The Role of Literature in Modern Society',
    score: 92,
    submittedAt: '2025-02-10T09:15:00Z',
    status: 'graded',
  },
  {
    id: 4,
    title: 'Understanding Economic Globalization',
    score: null,
    submittedAt: '2025-02-25T16:45:00Z',
    status: 'submitted',
  },
  {
    id: 5,
    title: 'The Psychology of Learning',
    score: null,
    submittedAt: '2025-02-28T11:20:00Z',
    status: 'draft',
  },
];

/**
 * Profile Essays Tab Component
 *
 * Displays user's essay submission history
 */
export function ProfileEssaysTab({ stats, essays = MOCK_ESSAYS }: ProfileEssaysTabProps) {
  const totalEssays = essays.length;
  const gradedEssays = essays.filter((e) => e.status === 'graded');
  const avgScore =
    gradedEssays.length > 0
      ? Math.round(gradedEssays.reduce((sum, e) => sum + (e.score || 0), 0) / gradedEssays.length)
      : null;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IconFile className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-slate-500">Total Essays</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {totalEssays}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IconTrendingUp className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="text-sm text-slate-500">Graded</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {gradedEssays.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <IconCalendar className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm text-slate-500">Avg Score</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {avgScore !== null ? `${avgScore}%` : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Essay List */}
      <Card className="border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="text-lg">Essay History</CardTitle>
        </CardHeader>
        <CardContent>
          {essays.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <IconFile className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No essays submitted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {essays.map((essay) => (
                <div
                  key={essay.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-slate-900 dark:text-white truncate">
                      {essay.title}
                    </h4>
                    <p className="text-sm text-slate-500 mt-1">
                      Submitted {formatDate(essay.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {essay.score !== null && (
                      <span
                        className={`text-lg font-semibold ${
                          essay.score >= 80
                            ? 'text-emerald-600'
                            : essay.score >= 60
                            ? 'text-amber-600'
                            : 'text-red-600'
                        }`}
                      >
                        {essay.score}%
                      </span>
                    )}
                    <Badge variant={getStatusVariant(essay.status)}>
                      {essay.status.charAt(0).toUpperCase() + essay.status.slice(1)}
                    </Badge>
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
