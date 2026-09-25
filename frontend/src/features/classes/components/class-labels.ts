export function classTermLabel(term: string, locale: 'en' | 'zh'): string {
  const labels: Record<string, [string, string]> = {
    semester1: ['Semester 1', '第一学期'],
    semester2: ['Semester 2', '第二学期'],
    term1: ['Term 1', '第一学段'],
    term2: ['Term 2', '第二学段'],
    full_year: ['Full year', '全年'],
  };
  const pair = labels[term];
  return pair ? pair[locale === 'zh' ? 1 : 0] : term;
}
