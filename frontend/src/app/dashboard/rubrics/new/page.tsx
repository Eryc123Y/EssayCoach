import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { resolveDashboardRole } from '@/lib/server-dashboard-auth';
import { ManualRubricForm } from '@/features/rubrics/components/manual-rubric-form';
import { Suspense } from 'react';

export default async function NewRubricPage() {
  const role = await resolveDashboardRole((await cookies()).get('access_token')?.value);
  if (!role) redirect('/auth/sign-in');
  return <Suspense fallback={<div className='p-8'>Loading…</div>}><ManualRubricForm canPublish={role !== 'student'} /></Suspense>;
}
