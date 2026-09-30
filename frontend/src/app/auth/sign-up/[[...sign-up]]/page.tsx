import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Activate invitation | EssayCoach',
  description: 'Activate your EssayCoach account using a teaching staff invitation.'
};

export default async function Page() {
  return <SignUpViewPage />;
}
