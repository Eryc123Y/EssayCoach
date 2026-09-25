'use client';

import { createContext, useContext } from 'react';

export type Language = 'en' | 'zh';
export type Role = 'student' | 'lecturer' | 'course_lead' | 'admin';
export type View =
  | 'landing'
  | 'signin'
  | 'invite'
  | 'dashboard'
  | 'practice'
  | 'feedback'
  | 'review'
  | 'rubrics'
  | 'assignments'
  | 'classes'
  | 'social'
  | 'analytics'
  | 'users'
  | 'profile'
  | 'settings'
  | 'help';

export const views: View[] = [
  'landing',
  'signin',
  'invite',
  'dashboard',
  'practice',
  'feedback',
  'review',
  'rubrics',
  'assignments',
  'classes',
  'social',
  'analytics',
  'users',
  'profile',
  'settings',
  'help'
];

export interface PrototypeState {
  language: Language;
  setLanguage: (language: Language) => void;
  role: Role;
  setRole: (role: Role) => void;
  view: View;
  go: (view: View) => void;
  notify: (message: string) => void;
  essay: string;
  setEssay: (essay: string) => void;
  goal: string;
  setGoal: (goal: string) => void;
  rubric: string;
  setRubric: (rubric: string) => void;
  feedbackReady: boolean;
  setFeedbackReady: (ready: boolean) => void;
  reviewScore: number;
  setReviewScore: (score: number) => void;
  reviewComment: string;
  setReviewComment: (comment: string) => void;
  lecturerReviewed: boolean;
  setLecturerReviewed: (reviewed: boolean) => void;
  reviewed: boolean;
  setReviewed: (reviewed: boolean) => void;
  gradePublished: boolean;
  setGradePublished: (published: boolean) => void;
  taskTitle: string;
  setTaskTitle: (title: string) => void;
  taskPublished: boolean;
  setTaskPublished: (published: boolean) => void;
  invitedUsers: string[];
  setInvitedUsers: (users: string[]) => void;
}

export const PrototypeContext = createContext<PrototypeState | null>(null);

export function usePrototype() {
  const value = useContext(PrototypeContext);
  if (!value) throw new Error('PrototypeContext is missing');
  return value;
}

export function useT() {
  const { language } = usePrototype();
  return (english: string, chinese: string) =>
    language === 'zh' ? chinese : english;
}
