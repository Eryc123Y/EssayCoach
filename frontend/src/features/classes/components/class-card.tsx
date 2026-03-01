'use client';

import { classService } from '@/service/api/v2';
import type { ClassItem } from '@/service/api/v2/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Edit, Trash2, Eye, Users, Archive } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface ClassCardProps {
  classItem: ClassItem;
  onUpdate: () => void;
}

export function ClassCard({ classItem, onUpdate }: ClassCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await classService.deleteClass(classItem.class_id);
      onUpdate();
    } catch (error) {
      toast.error('Failed to delete class. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await classService.archiveClass(classItem.class_id);
      onUpdate();
    } catch (error) {
      toast.error('Failed to archive class. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <Card className='transition-shadow hover:shadow-md'>
        <CardHeader>
          <div className='flex items-start justify-between'>
            <div className='space-y-1'>
              <CardTitle className='text-lg'>{classItem.class_name}</CardTitle>
              <CardDescription className='line-clamp-2'>
                {classItem.class_desc || 'No description'}
              </CardDescription>
            </div>
            <Badge
              variant={
                classItem.class_status === 'active' ? 'default' : 'secondary'
              }
            >
              {classItem.class_status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-2'>
          <div className='text-muted-foreground flex items-center text-sm'>
            <Users className='mr-2 h-4 w-4' />
            {classItem.class_size} students
          </div>
          {classItem.class_join_code && (
            <div className='text-sm'>
              Join Code:{' '}
              <span className='bg-muted rounded px-2 py-0.5 font-mono'>
                {classItem.class_join_code}
              </span>
            </div>
          )}
          <div className='text-muted-foreground text-sm'>
            Term: {classItem.class_term} {classItem.class_year}
          </div>
        </CardContent>

        <CardFooter className='flex items-center justify-between'>
          <Button
            variant='outline'
            size='sm'
            onClick={() =>
              router.push(`/dashboard/classes/${classItem.class_id}`)
            }
          >
            <Eye className='mr-2 h-4 w-4' />
            View
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/classes/${classItem.class_id}/edit`)
                }
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
              {classItem.class_status === 'active' && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className='mr-2 h-4 w-4' />
                  {isArchiving ? 'Archiving...' : 'Archive'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className='text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete class?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{classItem.class_name}&rdquo;.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
