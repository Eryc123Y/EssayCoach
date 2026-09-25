import { request } from '@/service/request';
import type { PracticeChatTurn, PracticeEssay, PracticeRun, RubricListItem } from './types';

const root = '/api/v2/practice';

export const practiceService = {
  listPublicRubrics: () => request<RubricListItem[]>({
    url: '/api/v2/core/rubrics/'
  }),
  importFile: (file: File) => {
    const data = new FormData();
    data.append('file', file);
    return request<{ filename: string; content: string; character_count: number }>({
      url: `${root}/import/`, method: 'POST', data
    });
  },
  listEssays: () => request<PracticeEssay[]>({ url: `${root}/essays/` }),
  createEssay: (data: {
    goal: string;
    content: string;
    language: 'en' | 'zh';
    audience?: string;
    tone?: string;
    rubric_id?: number | null;
  }) => request<PracticeEssay>({ url: `${root}/essays/`, method: 'POST', data }),
  getEssay: (id: string) => request<PracticeEssay>({ url: `${root}/essays/${id}/` }),
  saveEssay: (id: string, data: {
    expected_version: number;
    goal?: string;
    content?: string;
    language?: 'en' | 'zh';
    audience?: string;
    tone?: string;
    rubric_id?: number | null;
  }) => request<PracticeEssay>({ url: `${root}/essays/${id}/`, method: 'PATCH', data }),
  analyze: (id: string, expectedVersion: number) =>
    request<PracticeRun>({
      url: `${root}/essays/${id}/analyze/`, method: 'POST',
      data: { expected_version: expectedVersion }
    }),
  listRuns: (id: string) => request<PracticeRun[]>({ url: `${root}/essays/${id}/runs/` }),
  getRun: (id: string) => request<PracticeRun>({ url: `${root}/runs/${id}/` }),
  retryRun: (id: string) => request<PracticeRun>({ url: `${root}/runs/${id}/retry/`, method: 'POST' }),
  listChat: (id: string) => request<PracticeChatTurn[]>({ url: `${root}/runs/${id}/chat/` }),
  askCoach: (id: string, question: string) => request<PracticeChatTurn>({
    url: `${root}/runs/${id}/chat/`, method: 'POST', data: { question }
  }),
  retryCoach: (id: string) => request<PracticeChatTurn>({
    url: `${root}/chat/${id}/retry/`, method: 'POST'
  })
};
