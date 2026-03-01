'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  IconUser,
  IconShield,
  IconBell,
  IconLayoutDashboard,
  IconBuilding,
  IconKey
} from '@tabler/icons-react';

export type SettingsSection =
  | 'account'
  | 'security'
  | 'notifications'
  | 'display'
  | 'organization'
  | 'api';

interface SettingsSidebarProps {
  currentSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  userRole: 'student' | 'lecturer' | 'admin';
}

const navItems: {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  roles: ('student' | 'lecturer' | 'admin')[];
}[] = [
  {
    id: 'account',
    label: 'Account',
    icon: <IconUser className='size-4' />,
    roles: ['student', 'lecturer', 'admin']
  },
  {
    id: 'security',
    label: 'Security',
    icon: <IconShield className='size-4' />,
    roles: ['student', 'lecturer', 'admin']
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <IconBell className='size-4' />,
    roles: ['student', 'lecturer', 'admin']
  },
  {
    id: 'display',
    label: 'Display',
    icon: <IconLayoutDashboard className='size-4' />,
    roles: ['student', 'lecturer', 'admin']
  },
  {
    id: 'organization',
    label: 'Organization',
    icon: <IconBuilding className='size-4' />,
    roles: ['admin']
  },
  {
    id: 'api',
    label: 'API Keys',
    icon: <IconKey className='size-4' />,
    roles: ['admin']
  }
];

export function SettingsSidebar({
  currentSection,
  onSectionChange,
  userRole
}: SettingsSidebarProps) {
  const filteredItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <aside className='border-border bg-sidebar w-64 flex-shrink-0 border-r'>
      <ScrollArea className='h-full py-4'>
        <nav className='space-y-1 px-3'>
          {filteredItems.map((item) => (
            <Button
              key={item.id}
              variant={currentSection === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start gap-2',
                currentSection === item.id && 'bg-sidebar-accent'
              )}
              onClick={() => onSectionChange(item.id)}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
