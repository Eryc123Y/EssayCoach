'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/constants/data';
import { useAuth } from '@/components/layout/simple-auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconLogout,
  IconSettings,
  IconUserCircle
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';
import { BrandMark, BrandName } from './brand-mark';
import { usePreferences } from './preference-provider';
import { navigationLabel } from '@/lib/navigation-labels';
import { localized } from '@/locales';

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, classes, currentClass, setCurrentClass, logout } = useAuth();
  const { locale } = usePreferences();
  const router = useRouter();

  // Filter nav items based on user role
  const filteredNavItems = React.useMemo(() => {
    if (!user) {
      return [];
    }

    return navItems.filter((item) => {
      if (!item.roles) {
        return true;
      }
      return item.roles.includes(user.role);
    });
  }, [user]);

  // Show skeleton loading state while user data is being fetched
  if (!user) {
    return (
      <Sidebar collapsible='icon'>
        <SidebarHeader>
          <Skeleton className='h-12 w-full' />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className='h-4 w-16' />
            </SidebarGroupLabel>
            <SidebarMenu>
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <SidebarMenuButton>
                    <Skeleton className='h-4 w-4' />
                    <Skeleton className='h-4 w-24' />
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Skeleton className='h-12 w-full' />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <div className='flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0'>
          <BrandMark className='size-8' iconSize={16} />
          <BrandName className='truncate text-sm font-semibold group-data-[collapsible=icon]:hidden' />
        </div>
        <OrgSwitcher
          classes={classes}
          currentClass={currentClass}
          onClassChange={(classId) => setCurrentClass(classId)}
        />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>{localized(locale, 'landing.menu')}</SidebarGroupLabel>
          <SidebarMenu>
            {filteredNavItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              return item?.items && item?.items?.length > 0 ? (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={item.isActive}
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={navigationLabel(item.title, locale)}
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{navigationLabel(item.title, locale)}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                            >
                              <Link href={subItem.url}>
                                <span>{navigationLabel(subItem.title, locale)}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={navigationLabel(item.title, locale)}
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      <Icon />
                      <span>{navigationLabel(item.title, locale)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={{
                        imageUrl: undefined,
                        fullName: `${user.firstName} ${user.lastName}`,
                        emailAddresses: [{ emailAddress: user.email }]
                      }}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={{
                          imageUrl: undefined,
                          fullName: `${user.firstName} ${user.lastName}`,
                          emailAddresses: [{ emailAddress: user.email }]
                        }}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    {navigationLabel('Profile', locale)}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/settings')}
                  >
                    <IconSettings className='mr-2 h-4 w-4' />
                    {navigationLabel('Settings', locale)}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/dashboard/notifications')}>
                    <IconBell className='mr-2 h-4 w-4' />
                    {navigationLabel('Notifications', locale)}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <IconLogout className='mr-2 h-4 w-4' />
                  {localized(locale, 'ui.signOut')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
