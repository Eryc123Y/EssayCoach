import { NavItem } from '@/types';

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'My Classes',
    url: '/dashboard/classes',
    icon: 'laptop',
    isActive: false,
    shortcut: ['c', 'c'],
    items: [
      {
        title: 'AP English',
        url: '/dashboard/classes/ap-english',
        icon: 'book',
        shortcut: ['e', '1']
      },
      {
        title: 'History 101',
        url: '/dashboard/classes/history-101',
        icon: 'history',
        shortcut: ['h', '1']
      }
    ]
  },
  {
    title: 'Assignments',
    url: '/dashboard/assignments',
    icon: 'clipboard',
    shortcut: ['a', 'a'],
    isActive: false,
    items: []
  },
  {
    title: 'Essay Analysis',
    url: '/dashboard/essay-analysis',
    icon: 'post',
    shortcut: ['e', 'e'],
    isActive: false,
    items: []
  },
  {
    title: 'Rubrics',
    url: '/dashboard/rubrics',
    icon: 'clipboard',
    shortcut: ['r', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Library',
    url: '/dashboard/library',
    icon: 'library',
    shortcut: ['l', 'b'],
    isActive: false,
    items: []
  },
  {
    title: 'Account',
    url: '#',
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 's']
      },
      {
        title: 'Log out',
        shortcut: ['l', 'o'],
        url: '/',
        icon: 'login'
      }
    ]
  }
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
