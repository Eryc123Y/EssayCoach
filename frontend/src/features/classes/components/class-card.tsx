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
import { MoreVertical, Edit, Trash2, Eye, Users, Archive, Copy } from 'lucide-react';
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
import { usePreferences } from '@/components/layout/preference-provider';
import { classTermLabel } from './class-labels';
import { localized } from '@/locales';

interface ClassCardProps {
  classItem: ClassItem;
  onUpdate: () => void;
  canManage: boolean;
  canDuplicate: boolean;
}

export function ClassCard({ classItem, onUpdate, canManage, canDuplicate }: ClassCardProps) {
  const router = useRouter();
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);

  const handleDuplicate = async () => {
    setIsDuplicating(true);
    try {
      await classService.duplicateClass(classItem.class_id, `${classItem.class_name} ${localized(locale, 'ui.copy308dba')}`.slice(0, 100));
      onUpdate();
      toast.success(localized(locale, 'ui.createdAnEmptyClassCopy'));
    } catch {
      toast.error(localized(locale, 'ui.failedToDuplicateClass'));
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await classService.deleteClass(classItem.class_id);
      onUpdate();
    } catch {
      toast.error(localized(locale, 'ui.classesWithStudentsOrAssignmentsMustBeArchived'));
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
      toast.error(localized(locale, 'ui.failedToArchiveClassPleaseTryAgain'));
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
                {classItem.class_desc || (localized(locale, 'ui.noDescription'))}
              </CardDescription>
            </div>
            <Badge
              variant={
                classItem.class_status === 'active' ? 'default' : 'secondary'
              }
            >
              {classItem.class_status === 'active' ? (localized(locale, 'ui.activeb40ce1')) : (localized(locale, 'ui.archived'))}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className='space-y-2'>
          <div className='text-muted-foreground flex items-center text-sm'>
            <Users className='mr-2 h-4 w-4' />
            {zh ? `${classItem.class_size} 名学生` : `${classItem.class_size} students`}
          </div>
          {classItem.class_join_code && (
            <div className='text-sm'>
              {localized(locale, 'ui.joinCode')}
              <span className='bg-muted rounded px-2 py-0.5 font-mono'>
                {classItem.class_join_code}
              </span>
            </div>
          )}
          <div className='text-muted-foreground text-sm'>
            {localized(locale, 'ui.term')}{classTermLabel(classItem.class_term, locale)} {classItem.class_year}
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
            {localized(locale, 'ui.view')}
          </Button>

          {canManage && <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm' aria-label={localized(locale, 'ui.classActions')}>
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
                {localized(locale, 'nav.edit')}
              </DropdownMenuItem>
              {classItem.class_status === 'active' && (
                <DropdownMenuItem
                  onClick={handleArchive}
                  disabled={isArchiving}
                >
                  <Archive className='mr-2 h-4 w-4' />
                  {isArchiving ? (localized(locale, 'ui.archiving')) : (localized(locale, 'ui.archive'))}
                </DropdownMenuItem>
              )}
              {canDuplicate && <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
                <Copy className='mr-2 h-4 w-4' />{localized(locale, 'ui.duplicateEmptyClass')}
              </DropdownMenuItem>}
              <DropdownMenuItem
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className='text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                {localized(locale, 'ui.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>}
        </CardFooter>
      </Card>

      {canManage && <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{localized(locale, 'ui.deleteClass')}</AlertDialogTitle>
            <AlertDialogDescription>
              {zh ? `“${classItem.class_name}”将被永久删除，此操作无法撤销。` : <>This will permanently delete &ldquo;{classItem.class_name}&rdquo;. This action cannot be undone.</>}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{localized(locale, 'community.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (localized(locale, 'ui.deletingd1b100')) : (localized(locale, 'ui.delete'))}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>}
    </>
  );
}
