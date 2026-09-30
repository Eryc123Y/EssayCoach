'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePreferences } from '@/components/layout/preference-provider';
import {
  IconUser,
  IconShield,
  IconBell,
  IconLayoutDashboard,
  IconBuilding,
} from '@tabler/icons-react';
import { localized } from '@/locales';

export type SettingsSection =
  | 'account'
  | 'security'
  | 'notifications'
  | 'display'
  | 'organization';

interface SettingsSidebarProps {
  currentSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  userRole: 'student' | 'lecturer' | 'admin';
}

const navItems: {
  id: SettingsSection;
  labelId: string;
  icon: React.ReactNode;
  roles: ('student' | 'lecturer' | 'admin')[];
}[] = [
  {
    id: 'account',
    labelId: 'ui.settingsAccount',
    icon: <IconUser className="size-4" />,
    roles: ['student', 'lecturer', 'admin'],
  },
  {
    id: 'security',
    labelId: 'ui.settingsSecurity',
    icon: <IconShield className="size-4" />,
    roles: ['student', 'lecturer', 'admin'],
  },
  {
    id: 'notifications',
    labelId: 'ui.notifications',
    icon: <IconBell className="size-4" />,
    roles: ['student', 'lecturer', 'admin'],
  },
  {
    id: 'display',
    labelId: 'ui.settingsDisplay',
    icon: <IconLayoutDashboard className="size-4" />,
    roles: ['student', 'lecturer', 'admin'],
  },
  {
    id: 'organization',
    labelId: 'ui.settingsOrganization',
    icon: <IconBuilding className="size-4" />,
    roles: ['admin'],
  },
];

export function SettingsSidebar({
  currentSection,
  onSectionChange,
  userRole,
}: SettingsSidebarProps) {
  const { locale } = usePreferences();
  const filteredItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-full flex-shrink-0 border-b border-border bg-sidebar lg:w-64 lg:border-b-0 lg:border-r">
      <ScrollArea className="w-full py-2 lg:py-4">
        <nav className="flex gap-1 px-2 lg:block lg:space-y-1 lg:px-3">
          {filteredItems.map((item) => (
            <Button
              key={item.id}
              variant={currentSection === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'min-w-fit justify-start gap-2 lg:w-full',
                currentSection === item.id && 'bg-sidebar-accent'
              )}
              onClick={() => onSectionChange(item.id)}
            >
              {item.icon}
              {localized(locale, item.labelId)}
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
}
