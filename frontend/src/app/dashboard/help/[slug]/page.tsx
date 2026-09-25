import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { HelpArticle } from '@/features/help/help-article';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';

export default async function HelpArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  const { slug } = await params;
  const { language } = await searchParams;
  return <HelpArticle slug={slug} initialLanguage={language === 'zh' ? 'zh' : 'en'} />;
}
