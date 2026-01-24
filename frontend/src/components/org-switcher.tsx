'use client';

import { Check, ChevronsUpDown, GalleryVerticalEnd } from 'lucide-react';
import * as React from 'react';

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
  const selectedClass = currentClass || (classes.length > 0 ? classes[0] : null);

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
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <GalleryVerticalEnd className='size-4' />
              </div>
              <div className='flex flex-col gap-0.5 leading-none'>
                <span className='font-semibold'>{selectedClass.unitName}</span>
                <span className=''>{selectedClass.unitCode}</span>
              </div>
              {classes.length > 1 && <ChevronsUpDown className='ml-auto' />}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width]'
            align='start'
          >
            {classes.map((cls) => (
              <DropdownMenuItem
                key={cls.classId}
                onSelect={() => handleClassChange(cls)}
              >
                {cls.unitName}
                {cls.classId === selectedClass.classId && (
                  <Check className='ml-auto' />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
