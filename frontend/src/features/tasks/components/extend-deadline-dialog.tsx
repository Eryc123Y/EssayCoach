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
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

interface ExtendDeadlineDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ExtendDeadlineDialog({
  task,
  open,
  onOpenChange,
  onSuccess
}: ExtendDeadlineDialogProps) {
  const [newDeadline, setNewDeadline] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Format the current deadline for display
  const currentDeadline = new Date(task.task_due_datetime).toLocaleString();

  // Min datetime is now (can't extend to past)
  const minDatetime = new Date().toISOString().slice(0, 16);

  const handleSubmit = async () => {
    if (!newDeadline) {
      toast.error('Please select a new deadline');
      return;
    }

    const newDeadlineDate = new Date(newDeadline);
    const currentDeadlineDate = new Date(task.task_due_datetime);
    if (newDeadlineDate <= currentDeadlineDate) {
      toast.error('New deadline must be after the current deadline');
      return;
    }

    setIsLoading(true);
    try {
      await taskService.extendDeadline(task.task_id, {
        new_deadline: new Date(newDeadline).toISOString(),
        reason: reason.trim() || undefined
      });
      toast.success('Deadline extended successfully');
      onOpenChange(false);
      setNewDeadline('');
      setReason('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to extend deadline');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <CalendarClock className='h-4 w-4' />
            Extend Deadline
          </DialogTitle>
          <DialogDescription>
            Extend the deadline for &ldquo;{task.task_title}&rdquo;. Current
            deadline: <strong>{currentDeadline}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='new-deadline'>New Deadline *</Label>
            <Input
              id='new-deadline'
              type='datetime-local'
              min={minDatetime}
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='extend-reason'>Reason (optional)</Label>
            <Textarea
              id='extend-reason'
              placeholder='e.g. Medical leave, technical difficulties…'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
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
          <Button onClick={handleSubmit} disabled={isLoading || !newDeadline}>
            {isLoading ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Extending…
              </>
            ) : (
              <>
                <CalendarClock className='mr-2 h-4 w-4' />
                Extend Deadline
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
