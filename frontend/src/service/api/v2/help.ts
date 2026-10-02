import { request } from '@/service/request';

export type HelpLanguage = 'en' | 'zh';
export type HelpArticle = {
  id: number;
  slug: string;
  title: string;
  category: string;
  content: string;
  language: HelpLanguage;
  roles: string[];
  tags: string[];
};

export type ArticleVote = { helpful: boolean | null; helpful_count: number; unhelpful_count: number };
export type HelpFAQ = { question: string; answer: string };
export type SupportContact = { email: string | null; configured: boolean };

export type SupportTicket = {
  id: number;
  user_id: number;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  staff_reply: string;
  created_at: string;
  updated_at: string;
};

const BASE = '/api/v2/help';

export const helpService = {
  listFaqs(language: HelpLanguage): Promise<HelpFAQ[]> { return request({ url: `${BASE}/faqs/`, params: { language } }); },
  getSupportContact(): Promise<SupportContact> { return request({ url: `${BASE}/support/contact/` }); },
  listArticles(language: HelpLanguage, query = '', category = ''): Promise<HelpArticle[]> {
    return request({ url: `${BASE}/articles/`, params: { language, query, category: category || undefined } });
  },
  getArticle(slug: string, language: HelpLanguage): Promise<HelpArticle> {
    return request({ url: `${BASE}/articles/${encodeURIComponent(slug)}/`, params: { language } });
  },
  getArticleVote(slug: string): Promise<ArticleVote> {
    return request({ url: `${BASE}/articles/${encodeURIComponent(slug)}/feedback/` });
  },
  voteOnArticle(slug: string, helpful: boolean): Promise<ArticleVote> {
    return request({ url: `${BASE}/articles/${encodeURIComponent(slug)}/feedback/`, method: 'POST', data: { helpful } });
  },
  listTickets(): Promise<SupportTicket[]> {
    return request({ url: `${BASE}/tickets/me/` });
  },
  createTicket(data: { subject: string; description: string; priority: SupportTicket['priority'] }): Promise<SupportTicket> {
    return request({ url: `${BASE}/tickets/`, method: 'POST', data });
  },
  listAdminTickets(): Promise<SupportTicket[]> {
    return request({ url: `${BASE}/admin/tickets/` });
  },
  updateTicket(id: number, data: { status: SupportTicket['status']; staff_reply: string }): Promise<SupportTicket> {
    return request({ url: `${BASE}/admin/tickets/${id}/`, method: 'PATCH', data });
  },
};
