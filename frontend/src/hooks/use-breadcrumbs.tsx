'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

const staticRouteMapping: Record<string, BreadcrumbItem[]> = {
  '/dashboard': [{ title: 'Dashboard', link: '/dashboard' }],
  '/dashboard/overview': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Overview', link: '/dashboard/overview' }
  ],
  '/dashboard/essay-analysis': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Essay Analysis', link: '/dashboard/essay-analysis' }
  ],
  '/dashboard/essay': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Essay Practice', link: '/dashboard/essay' }
  ],
  '/dashboard/rubrics': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Rubrics', link: '/dashboard/rubrics' }
  ],
  '/dashboard/tasks': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Tasks', link: '/dashboard/tasks' }
  ],
  '/dashboard/tasks/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Tasks', link: '/dashboard/tasks' },
    { title: 'New Task', link: '/dashboard/tasks/new' }
  ],
  '/dashboard/classes': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Classes', link: '/dashboard/classes' }
  ],
  '/dashboard/classes/new': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Classes', link: '/dashboard/classes' },
    { title: 'New Class', link: '/dashboard/classes/new' }
  ],
  '/dashboard/profile': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Profile', link: '/dashboard/profile' }
  ],
  '/dashboard/settings': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Settings', link: '/dashboard/settings' }
  ],
  '/dashboard/student': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Student', link: '/dashboard/student' }
  ],
  '/dashboard/lecturer': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Lecturer', link: '/dashboard/lecturer' }
  ],
  '/dashboard/admin': [
    { title: 'Dashboard', link: '/dashboard' },
    { title: 'Admin', link: '/dashboard/admin' }
  ]
};

type DynamicRouteMatcher = {
  pattern: RegExp;
  map: (match: RegExpMatchArray) => BreadcrumbItem[];
};

const dynamicRouteMatchers: DynamicRouteMatcher[] = [
  {
    pattern: /^\/dashboard\/rubrics\/([^/]+)$/,
    map: (match) => [
      { title: 'Dashboard', link: '/dashboard' },
      { title: 'Rubrics', link: '/dashboard/rubrics' },
      { title: 'Rubric Details', link: `/dashboard/rubrics/${match[1]}` }
    ]
  },
  {
    pattern: /^\/dashboard\/tasks\/([^/]+)$/,
    map: (match) => [
      { title: 'Dashboard', link: '/dashboard' },
      { title: 'Tasks', link: '/dashboard/tasks' },
      { title: `Task ${match[1]}`, link: `/dashboard/tasks/${match[1]}` }
    ]
  },
  {
    pattern: /^\/dashboard\/tasks\/([^/]+)\/edit$/,
    map: (match) => [
      { title: 'Dashboard', link: '/dashboard' },
      { title: 'Tasks', link: '/dashboard/tasks' },
      { title: `Task ${match[1]}`, link: `/dashboard/tasks/${match[1]}` },
      { title: 'Edit', link: `/dashboard/tasks/${match[1]}/edit` }
    ]
  },
  {
    pattern: /^\/dashboard\/classes\/([^/]+)$/,
    map: (match) => [
      { title: 'Dashboard', link: '/dashboard' },
      { title: 'Classes', link: '/dashboard/classes' },
      { title: `Class ${match[1]}`, link: `/dashboard/classes/${match[1]}` }
    ]
  },
  {
    pattern: /^\/dashboard\/classes\/([^/]+)\/edit$/,
    map: (match) => [
      { title: 'Dashboard', link: '/dashboard' },
      { title: 'Classes', link: '/dashboard/classes' },
      { title: `Class ${match[1]}`, link: `/dashboard/classes/${match[1]}` },
      { title: 'Edit', link: `/dashboard/classes/${match[1]}/edit` }
    ]
  }
];

function toTitleCase(segment: string): string {
  return segment
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Check if we have a custom mapping for this exact path
    if (staticRouteMapping[pathname]) {
      return staticRouteMapping[pathname];
    }

    for (const matcher of dynamicRouteMatchers) {
      const match = pathname.match(matcher.pattern);
      if (match) {
        return matcher.map(match);
      }
    }

    // If no exact match, fall back to generating breadcrumbs from the path
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        title: toTitleCase(segment),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}
