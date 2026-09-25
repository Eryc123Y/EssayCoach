import { request } from '@/service/request';

export type InboxNotice = {
  id: number;
  kind: string;
  title_en: string;
  title_zh: string;
  body_en: string;
  body_zh: string;
  link: string;
  read_at: string | null;
  created_at: string;
};

export type Inbox = { unread_count: number; items: InboxNotice[] };

export const notificationService = {
  list: () => request<Inbox>({ url: '/api/v2/notifications/' }),
  markRead: (id: number) => request<InboxNotice>({ url: `/api/v2/notifications/${id}/read/`, method: 'POST' }),
};
