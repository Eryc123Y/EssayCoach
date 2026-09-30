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
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { usePreferences } from '@/components/layout/preference-provider';
import { localized } from '@/locales';

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
  onSuccess,
}: DuplicateTaskDialogProps) {
  const { locale } = usePreferences();
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await taskService.duplicateTask(task.task_id, {
        task_title: title.trim() || undefined,
      });
      toast.success(localized(locale, 'ui.assignmentDuplicated'));
      onOpenChange(false);
      setTitle('');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (localized(locale, 'ui.failedToDuplicateAssignment')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-4 w-4" />
            {localized(locale, 'ui.duplicateAssignment')}
          </DialogTitle>
          <DialogDescription>
            {localized(locale, 'ui.createACopyOfTitleAsADraft', { title: task.task_title })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dup-title">{localized(locale, 'ui.newTitleOptional')}</Label>
            <Input
              id="dup-title"
              placeholder={localized(locale, 'ui.copyOfTitle', { title: task.task_title })}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {localized(locale, 'ui.leaveBlankToGenerateATitle')}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {localized(locale, 'community.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {localized(locale, 'ui.duplicating')}
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {localized(locale, 'ui.duplicate')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
