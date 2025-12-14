import UserViewPage from '@/features/users/components/user-view-page';

export default function Page({ params }: { params: { userId: string } }) {
  return <UserViewPage userId={params.userId} />;
}


