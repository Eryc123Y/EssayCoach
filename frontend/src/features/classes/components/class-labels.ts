import { localized } from '@/locales';

const TERM_LABEL_IDS: Record<string, string> = {
  semester1: 'ui.termSemester1',
  semester2: 'ui.termSemester2',
  term1: 'ui.termTerm1',
  term2: 'ui.termTerm2',
  full_year: 'ui.termFullYear'
};

export function classTermLabel(term: string, locale: 'en' | 'zh'): string {
  const id = TERM_LABEL_IDS[term];
  return id ? localized(locale, id) : term;
}
