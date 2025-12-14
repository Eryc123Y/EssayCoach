'use client';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { Column, ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Text } from 'lucide-react';
import { CellAction } from './cell-action';
import type { User } from '@/features/users/mock/users-mock';

export const columns: ColumnDef<User>[] = [
  {
    id: 'name',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const user = row.original as User;
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{user.firstName} {user.lastName}</span>
          <span className='text-muted-foreground text-xs'>{user.email}</span>
        </div>
      );
    },
    meta: {
      label: 'Name or email',
      placeholder: 'Search users...',
      variant: 'text',
      icon: Text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'role',
    header: ({ column }: { column: Column<User, unknown> }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ cell }) => {
      const role = cell.getValue<User['role']>();
      return <Badge variant='outline' className='capitalize'>{role}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Role',
      variant: 'select',
      options: [
        { value: 'student', label: 'Student' },
        { value: 'lecturer', label: 'Lecturer' },
        { value: 'admin', label: 'Admin' }
      ]
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell }) => {
      const status = cell.getValue<User['status']>();
      const variant = status === 'active' ? 'default' : 'secondary';
      return <Badge variant={variant as any} className='capitalize'>{status}</Badge>;
    },
    enableColumnFilter: true,
    meta: {
      label: 'Status',
      variant: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'unregistered', label: 'Unregistered' },
        { value: 'suspended', label: 'Suspended' }
      ]
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];


