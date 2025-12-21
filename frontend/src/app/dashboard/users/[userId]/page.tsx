import UserViewPage from '@/features/users/components/user-view-page';
import { use } from 'react';

export default function Page({
  params
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = use(params);
  return <UserViewPage userId={userId} />;
}


