'use client';

import * as React from 'react';

import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';

interface ClassInfo {
  classId: number;
  unitName: string;
  unitCode: string;
  classSize: number;
}

interface OrgSwitcherProps {
  classes: ClassInfo[];
  currentClass: ClassInfo | null;
  onClassChange: (classId: number) => void;
}

export function OrgSwitcher({
  classes,
  currentClass,
  onClassChange
}: OrgSwitcherProps) {
  const selectedClass =
    currentClass || (classes.length > 0 ? classes[0] : null);

  const handleClassChange = (cls: ClassInfo) => {
    onClassChange(cls.classId);
  };

  if (!selectedClass) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground h-auto py-2 transition-all'
              aria-label='Select class'
            >
              <div className='flex w-full flex-col gap-1.5'>
                <div className='flex items-center gap-2 px-0.5'>
                  <div className='bg-primary/10 text-primary flex aspect-square size-5 items-center justify-center rounded-md'>
                    <Icons.classSwitcher className='size-3.5' />
                  </div>
                  <span className='text-muted-foreground/80 text-[10px] font-bold tracking-widest uppercase'>
                    Current Class
                  </span>
                </div>
                <div className='flex items-center justify-between gap-2 px-0.5'>
                  <div className='flex flex-col items-start gap-0.5 overflow-hidden leading-none'>
                    <span className='text-sidebar-foreground truncate font-bold group-data-[collapsible=icon]:hidden'>
                      {selectedClass.unitName}
                    </span>
                    <span className='text-muted-foreground/60 text-[10px] group-data-[collapsible=icon]:hidden'>
                      {selectedClass.unitCode}
                    </span>
                  </div>
                  <Icons.chevronDown className='size-4 shrink-0 opacity-40 group-data-[collapsible=icon]:hidden' />
                </div>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-64 rounded-xl border-slate-200 shadow-lg dark:border-slate-800'
            align='start'
            sideOffset={4}
          >
            <div className='text-muted-foreground/50 px-2 py-1.5 text-[10px] font-bold tracking-widest uppercase'>
              Switch Class
            </div>
            {classes.map((cls) => (
              <DropdownMenuItem
                key={cls.classId}
                onSelect={() => handleClassChange(cls)}
                className='focus:bg-sidebar-accent flex flex-col items-start gap-0.5 px-3 py-2'
              >
                <div className='flex w-full items-center justify-between'>
                  <span className='font-semibold'>{cls.unitName}</span>
                  {cls.classId === selectedClass.classId && (
                    <Icons.check className='text-primary size-4' />
                  )}
                </div>
                <span className='text-muted-foreground text-xs'>
                  {cls.unitCode}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
