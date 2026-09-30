'use client';

import type { Role, View } from './prototype-context';
import { usePrototype, useT } from './prototype-context';
import { Action, EmptyState } from './prototype-ui';
import {
  DashboardView,
  FeedbackView,
  InviteView,
  LandingView,
  PracticeView,
  ReviewView,
  SignInView
} from './views-core';
import {
  AssignmentsView,
  ClassesView,
  RubricsView,
  SocialView
} from './views-learning';
import {
  AnalyticsView,
  HelpView,
  ProfileView,
  SettingsView,
  UsersView
} from './views-management';

function RestrictedView({ required }: { required: Role }) {
  const t = useT();
  const { setRole } = usePrototype();
  return (
    <EmptyState
      title={t('Switch preview role', '切换预览角色')}
      body={t(
        'This screen belongs to another workspace role.',
        '此页面属于另一种工作区角色。'
      )}
      action={
        <Action onClick={() => setRole(required)}>
          {t('Switch role', '切换角色')}
        </Action>
      }
    />
  );
}

export function renderPrototypeView(view: View, role: Role) {
  switch (view) {
    case 'landing':
      return <LandingView />;
    case 'signin':
      return <SignInView />;
    case 'invite':
      return <InviteView />;
    case 'dashboard':
      return <DashboardView />;
    case 'practice':
      return role === 'student' ? (
        <PracticeView />
      ) : (
        <RestrictedView required='student' />
      );
    case 'feedback':
      return role === 'student' ? (
        <FeedbackView />
      ) : (
        <RestrictedView required='student' />
      );
    case 'review':
      return role === 'lecturer' || role === 'course_lead' ? (
        <ReviewView />
      ) : (
        <RestrictedView required='lecturer' />
      );
    case 'rubrics':
      return <RubricsView />;
    case 'assignments':
      return <AssignmentsView />;
    case 'classes':
      return <ClassesView />;
    case 'social':
      return role === 'admin' ? (
        <RestrictedView required='student' />
      ) : (
        <SocialView />
      );
    case 'analytics':
      return <AnalyticsView />;
    case 'users':
      return role === 'admin' ? (
        <UsersView />
      ) : (
        <RestrictedView required='admin' />
      );
    case 'profile':
      return <ProfileView />;
    case 'settings':
      return <SettingsView />;
    case 'help':
      return <HelpView />;
  }
}
