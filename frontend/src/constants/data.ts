import { NavItem } from '@/types';

// Navigation items with role-based access control
// roles: which user roles can see this item
// If roles is undefined, the item is visible to all
export const navItems: NavItem[] = [
  // Dashboard - visible to all (redirects to role-specific dashboard)
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },

  // Essay Analysis - visible to all
  {
    title: 'Essay Analysis',
    url: '/dashboard/essay-analysis',
    icon: 'post',
    shortcut: ['e', 'e'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  // Rubrics - visible to all roles (students can view public rubrics)
  {
    title: 'Rubrics',
    url: '/dashboard/rubrics',
    icon: 'book',
    shortcut: ['r', 'r'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  // Tasks (Assignments) - PRD-09
  {
    title: 'Tasks',
    url: '/dashboard/tasks',
    icon: 'clipboard',
    shortcut: ['a', 'a'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  // Classes - PRD-10
  {
    title: 'Classes',
    url: '/dashboard/classes',
    icon: 'users',
    shortcut: ['c', 'c'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  {
    title: 'Community',
    url: '/dashboard/community',
    icon: 'library',
    shortcut: ['l', 'b'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  {
    title: 'Help',
    url: '/dashboard/help',
    icon: 'help',
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: 'chart',
    shortcut: ['g', 'g'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin']
  },
  {
    title: 'People',
    url: '/dashboard/users',
    icon: 'users',
    isActive: false,
    items: [],
    roles: ['admin']
  },
  {
    title: 'Operations',
    url: '/dashboard/observability',
    icon: 'dashboard',
    isActive: false,
    items: [],
    roles: ['admin']
  },
];

export interface RecentSubmission {
  id: number;
  name: string;
  email: string;
  assignment: string;
  score: string;
  image: string;
  initials: string;
  status: 'Graded' | 'Pending' | 'Late';
  aiStatus: 'Feedback Ready' | 'Processing' | 'Draft' | 'N/A';
}

export const recentSubmissionsData: RecentSubmission[] = [
  {
    id: 1,
    name: 'Alex Johnson',
    email: 'alex.j@school.edu',
    assignment: 'Narrative Essay',
    score: '92/100',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Alex',
    initials: 'AJ',
    status: 'Graded',
    aiStatus: 'Feedback Ready'
  },
  {
    id: 2,
    name: 'Sarah Chen',
    email: 'sarah.c@school.edu',
    assignment: 'Critical Review',
    score: 'Pending',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Sarah',
    initials: 'SC',
    status: 'Pending',
    aiStatus: 'Processing'
  },
  {
    id: 3,
    name: 'Michael Torres',
    email: 'm.torres@school.edu',
    assignment: 'Research Proposal',
    score: '88/100',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Michael',
    initials: 'MT',
    status: 'Graded',
    aiStatus: 'Feedback Ready'
  },
  {
    id: 4,
    name: 'Emily Watson',
    email: 'emily.w@school.edu',
    assignment: 'Persuasive Essay',
    score: '95/100',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=Emily',
    initials: 'EW',
    status: 'Graded',
    aiStatus: 'Feedback Ready'
  },
  {
    id: 5,
    name: 'David Kim',
    email: 'david.k@school.edu',
    assignment: 'Hamlet Analysis',
    score: 'Pending',
    image: 'https://api.dicebear.com/9.x/notionists/svg?seed=David',
    initials: 'DK',
    status: 'Late',
    aiStatus: 'Draft'
  }
];
