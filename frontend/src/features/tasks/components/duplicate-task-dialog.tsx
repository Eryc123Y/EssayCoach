'use client';

import { useState } from 'react';
import { taskService } from '@/service/api/v2';
import type { Task } from '@/service/api/v2/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface DuplicateTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function DuplicateTaskDialog({
  task,
  open,
  onOpenChange,
  onSuccess
}: DuplicateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await taskService.duplicateTask(task.task_id, {
        task_title: title.trim() || undefined
      });
      toast.success('Task duplicated successfully');
      onOpenChange(false);
      setTitle('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Copy className='h-4 w-4' />
            Duplicate Task
          </DialogTitle>
          <DialogDescription>
            Create a copy of &ldquo;{task.task_title}&rdquo;. The duplicate will
            be created as a draft.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='dup-title'>New Title (optional)</Label>
            <Input
              id='dup-title'
              placeholder={`Copy of ${task.task_title}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className='text-muted-foreground text-xs'>
              Leave blank to auto-generate a title.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Duplicating…
              </>
            ) : (
              <>
                <Copy className='mr-2 h-4 w-4' />
                Duplicate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
