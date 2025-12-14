'use client';
import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import type { User } from '@/features/users/mock/users-mock';
import { IconEdit, IconDotsVertical, IconTrash } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface CellActionProps {
  data: User;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading] = useState(false);
  const [openSuspend, setOpenSuspend] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const router = useRouter();

  const onConfirmSuspend = async () => {
    setOpenSuspend(false);
  };

  const onConfirmDelete = async () => {
    setOpenDelete(false);
  };

  return (
    <>
      <AlertModal
        isOpen={openSuspend}
        onClose={() => setOpenSuspend(false)}
        onConfirm={onConfirmSuspend}
        loading={loading}
        title='Suspend user?'
        description='Are you sure you want to suspend this user?'
      />
      <AlertModal
        isOpen={openDelete}
        onClose={() => setOpenDelete(false)}
        onConfirm={onConfirmDelete}
        loading={loading}
        title='Delete user?'
        description='This action cannot be undone.'
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Open menu</span>
            <IconDotsVertical className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${data.id}`)}>
            <IconEdit className='mr-2 h-4 w-4' /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenSuspend(true)}>
            Suspend
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDelete(true)}>
            <IconTrash className='mr-2 h-4 w-4' /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};


