import { useAuth } from '@/components/layout/simple-auth-context';

export default function ProfileViewPage() {
  const { user } = useAuth();
  return (
    <div className='flex w-full flex-col p-4'>
      <div className='max-w-md space-y-2 rounded-lg border p-4'>
        <div className='text-lg font-semibold'>Profile</div>
        <div className='text-muted-foreground text-sm'>
          Signed in as {user?.firstName} {user?.lastName} ({user?.email})
        </div>
      </div>
    </div>
  );
}
