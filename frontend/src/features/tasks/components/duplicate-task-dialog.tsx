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
  const zh = locale === 'zh';
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await taskService.duplicateTask(task.task_id, {
        task_title: title.trim() || undefined,
      });
      toast.success(zh ? '已复制作业。' : 'Assignment duplicated.');
      onOpenChange(false);
      setTitle('');
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (zh ? '复制作业失败。' : 'Failed to duplicate assignment.'));
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
            {zh ? '复制作业' : 'Duplicate assignment'}
          </DialogTitle>
          <DialogDescription>
            {zh ? `将“${task.task_title}”复制为草稿。` : <>Create a copy of &ldquo;{task.task_title}&rdquo; as a draft.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dup-title">{zh ? '新标题（可选）' : 'New title (optional)'}</Label>
            <Input
              id="dup-title"
              placeholder={zh ? `复制：${task.task_title}` : `Copy of ${task.task_title}`}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {zh ? '留空则自动生成标题。' : 'Leave blank to generate a title.'}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {zh ? '取消' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {zh ? '复制中…' : 'Duplicating…'}
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                {zh ? '复制' : 'Duplicate'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
