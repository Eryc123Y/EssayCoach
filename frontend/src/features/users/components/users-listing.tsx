import { searchParamsCache } from '@/lib/searchparams';
import { fakeUsers, type User } from '@/features/users/mock/users-mock';
import { UsersTable } from '@/features/users/components/users-table';
import { columns } from '@/features/users/components/users-table/columns';

type UsersListingPageProps = {};

export default async function UsersListingPage({}: UsersListingPageProps) {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const role = searchParamsCache.get('role');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status }),
    ...(role && { role })
  };

  const data = await fakeUsers.getUsers(filters);
  const totalUsers = data.total_users;
  const users: User[] = data.users;

  return <UsersTable data={users} totalItems={totalUsers} columns={columns} />;
}


