import { fakeUsers, type User } from '@/features/users/mock/users-mock';
import { notFound } from 'next/navigation';
import UserForm from '@/features/users/components/user-form';

type UserViewPageProps = {
  userId: string;
};

export default async function UserViewPage({ userId }: UserViewPageProps) {
  let user: User | null = null;
  let pageTitle = 'Create New User';

  if (userId !== 'new') {
    const data = await fakeUsers.getUserById(Number(userId));
    user = data.user as User;
    if (!user) {
      notFound();
    }
    pageTitle = `Edit User`;
  }

  return <UserForm initialData={user} pageTitle={pageTitle} />;
}


