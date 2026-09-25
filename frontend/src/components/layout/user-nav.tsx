'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { useAuth } from '@/components/layout/simple-auth-context';
import { useRouter } from 'next/navigation';
import { usePreferences } from './preference-provider';
import { navigationLabel } from '@/lib/navigation-labels';
export function UserNav() {
  const { user, logout } = useAuth();
  const { locale } = usePreferences();
  const router = useRouter();
  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <UserAvatarProfile
              user={{
                imageUrl: undefined,
                fullName: `${user.firstName} ${user.lastName}`,
                emailAddresses: [{ emailAddress: user.email }]
              }}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className='w-56'
          align='end'
          sideOffset={10}
          forceMount
        >
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col space-y-1'>
              <p className='text-sm leading-none font-medium'>{`${user.firstName} ${user.lastName}`}</p>
              <p className='text-muted-foreground text-xs leading-none'>
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              {navigationLabel('Profile', locale)}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
              {navigationLabel('Settings', locale)}
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>{locale === 'zh' ? '退出登录' : 'Sign out'}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
}
