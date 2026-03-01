'use client';

import { taskService } from '@/service/api/v2';
import type { Task } from '@/service/api/v2/types';
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
import {
  MoreVertical,
  Edit,
  Trash2,
  FileText,
  Copy,
  CalendarClock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { DuplicateTaskDialog } from './duplicate-task-dialog';
import { ExtendDeadlineDialog } from './extend-deadline-dialog';

interface TaskCardProps {
  task: Task;
  userRole: 'student' | 'lecturer' | 'admin';
  onUpdate: () => void;
}

export function TaskCard({ task, userRole, onUpdate }: TaskCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [extendOpen, setExtendOpen] = useState(false);

  const statusColors: Record<string, string> = {
    draft: 'bg-secondary text-secondary-foreground',
    published: 'bg-green-500 text-white',
    unpublished: 'bg-orange-500 text-white',
    archived: 'bg-muted text-muted-foreground'
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
    try {
      await taskService.deleteTask(task.task_id);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete task:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async () => {
    try {
      await taskService.publishTask(task.task_id);
      onUpdate();
    } catch (error) {
      console.error('Failed to publish task:', error);
    }
  };

  const handleUnpublish = async () => {
    try {
      await taskService.unpublishTask(task.task_id);
      onUpdate();
    } catch (error) {
      console.error('Failed to unpublish task:', error);
    }
  };

  const canEdit = userRole === 'lecturer' || userRole === 'admin';

  return (
    <Card className='transition-shadow hover:shadow-md'>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <CardTitle className='text-lg'>{task.task_title}</CardTitle>
            <CardDescription className='line-clamp-2'>
              {task.task_desc || 'No description'}
            </CardDescription>
          </div>
          <Badge className={statusColors[task.task_status] || 'bg-secondary'}>
            {task.task_status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className='space-y-2'>
        {task.class_id_class && (
          <div className='text-muted-foreground text-sm'>
            Class ID: {task.class_id_class}
          </div>
        )}
        <div className='text-muted-foreground text-sm'>
          Due: {new Date(task.task_due_datetime).toLocaleDateString()}
        </div>
        {task.task_allow_late_submission && (
          <div className='text-sm text-green-600'>Late submissions allowed</div>
        )}
      </CardContent>

      <CardFooter className='flex items-center justify-between'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => router.push(`/dashboard/tasks/${task.task_id}`)}
        >
          <FileText className='mr-2 h-4 w-4' />
          {userRole === 'student' ? 'Submit' : 'View'}
        </Button>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='sm'>
                <MoreVertical className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/tasks/${task.task_id}/edit`)
                }
              >
                <Edit className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
              {task.task_status === 'published' ? (
                <DropdownMenuItem onClick={handleUnpublish}>
                  Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={handlePublish}
                  disabled={task.task_status === 'archived'}
                >
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDuplicateOpen(true)}>
                <Copy className='mr-2 h-4 w-4' />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExtendOpen(true)}>
                <CalendarClock className='mr-2 h-4 w-4' />
                Extend Deadline
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting}
                className='text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>

      <DuplicateTaskDialog
        task={task}
        open={duplicateOpen}
        onOpenChange={setDuplicateOpen}
        onSuccess={onUpdate}
      />
      <ExtendDeadlineDialog
        task={task}
        open={extendOpen}
        onOpenChange={setExtendOpen}
        onSuccess={onUpdate}
      />
    </Card>
  );
}
