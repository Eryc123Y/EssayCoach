import { NavItem } from '@/types';

// Navigation items with role-based access control
// roles: which user roles can see this item
// If roles is undefined, the item is visible to all
export const navItems: NavItem[] = [
  // Dashboard - visible to all
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    roles: ['student', 'lecturer', 'admin'],
  },
  // Assignments - visible to all
  {
    title: 'Assignments',
    url: '/dashboard/assignments',
    icon: 'clipboard',
    shortcut: ['a', 'a'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin'],
  },
  // Essay Analysis - visible to all
  {
    title: 'Essay Analysis',
    url: '/dashboard/essay-analysis',
    icon: 'post',
    shortcut: ['e', 'e'],
    isActive: false,
    items: [],
    roles: ['student', 'lecturer', 'admin'],
  },
  // Rubrics - only lecturer and admin
  {
    title: 'Rubrics',
    url: '/dashboard/rubrics',
    icon: 'book',  // Using 'book' icon for rubrics (different from 'clipboard' used by Assignments)
    shortcut: ['r', 'r'],
    isActive: false,
    items: [],
    roles: ['lecturer', 'admin'],
  },
  // Library - only lecturer and admin
  {
    title: 'Library',
    url: '/dashboard/library',
    icon: 'library',
    shortcut: ['l', 'b'],
    isActive: false,
    items: [],
    roles: ['lecturer', 'admin'],
  },
  // Analytics - only admin
  {
    title: 'Analytics',
    url: '/dashboard/analytics',
    icon: 'chart',
    shortcut: ['g', 'g'],
    isActive: false,
    items: [],
    roles: ['admin'],
  },
  // User Management - only admin
  {
    title: 'User Management',
    url: '/dashboard/users',
    icon: 'users',
    shortcut: ['u', 'u'],
    isActive: false,
    items: [],
    roles: ['admin'],
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
