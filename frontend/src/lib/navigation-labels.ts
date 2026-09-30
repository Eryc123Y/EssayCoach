import { message, type Locale, type MessageId } from '@/locales';

const messageIds: Record<string, MessageId> = {
  Dashboard: 'nav.dashboard',
  'Essay Analysis': 'nav.practice',
  'Essay Practice': 'nav.practice',
  Rubrics: 'nav.rubrics',
  Tasks: 'nav.tasks',
  Classes: 'nav.classes',
  Community: 'nav.community',
  Help: 'nav.help',
  Analytics: 'nav.analytics',
  People: 'nav.users',
  Users: 'nav.users',
  Operations: 'nav.operations',
  Observability: 'nav.operations',
  Profile: 'nav.profile',
  Settings: 'nav.settings',
  Notifications: 'nav.notifications',
  Admin: 'nav.admin',
  Student: 'nav.student',
  Lecturer: 'nav.lecturer',
  'New Task': 'nav.newTask',
  'New Class': 'nav.newClass',
  New: 'nav.new',
  'Rubric Details': 'nav.rubricDetails',
  Edit: 'nav.edit',
  Overview: 'nav.overview',
  Review: 'nav.review',
  Submissions: 'nav.submissions'
};

export function navigationLabel(label: string, locale: Locale): string {
  const id = messageIds[label];
  return id ? message(id, locale) : label;
}
