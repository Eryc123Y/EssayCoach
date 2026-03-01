'use client';

import { useState } from 'react';
import { classService } from '@/service/api/v2';
import type { BatchEnrollResult } from '@/service/api/v2/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchEnrollDialogProps {
  classId: number;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0);
}

export function BatchEnrollDialog({
  classId,
  className,
  open,
  onOpenChange,
  onSuccess
}: BatchEnrollDialogProps) {
  const [emailsRaw, setEmailsRaw] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BatchEnrollResult | null>(null);

  const emails = parseEmails(emailsRaw);

  const handleSubmit = async () => {
    if (emails.length === 0) {
      toast.error('Please enter at least one email address');
      return;
    }

    setIsLoading(true);
    try {
      const res = await classService.batchEnrollStudents({
        class_id: classId,
        student_emails: emails
      });
      setResult(res);
      if (res.enrolled_count > 0 || res.created_count > 0) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to batch enroll students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEmailsRaw('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Batch Enroll Students
          </DialogTitle>
          <DialogDescription>
            Enroll multiple students into &ldquo;{className}&rdquo; by email.
            New accounts will be created automatically for unknown emails.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className='space-y-2 py-2'>
              <Label htmlFor='emails'>
                Email Addresses ({emails.length} detected)
              </Label>
              <Textarea
                id='emails'
                placeholder={'student1@example.com\nstudent2@example.com'}
                value={emailsRaw}
                onChange={(e) => setEmailsRaw(e.target.value)}
                rows={6}
                className='font-mono text-sm'
              />
              <p className='text-muted-foreground text-xs'>
                Separate emails with newlines, commas, or semicolons.
              </p>
            </div>

            <DialogFooter>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || emails.length === 0}
              >
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Enrolling…
                  </>
                ) : (
                  <>
                    <Users className='mr-2 h-4 w-4' />
                    Enroll{' '}
                    {emails.length > 0
                      ? `${emails.length} Students`
                      : 'Students'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className='space-y-3 py-2'>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div className='flex items-center gap-2 rounded-md bg-green-50 p-3 dark:bg-green-900/20'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <div>
                    <div className='font-medium text-green-700 dark:text-green-400'>
                      {result.enrolled_count} Enrolled
                    </div>
                    <div className='text-xs text-green-600'>
                      {result.created_count} new accounts
                    </div>
                  </div>
                </div>
                {result.failed.length > 0 && (
                  <div className='flex items-center gap-2 rounded-md bg-red-50 p-3 dark:bg-red-900/20'>
                    <XCircle className='h-4 w-4 text-red-600' />
                    <div>
                      <div className='font-medium text-red-700 dark:text-red-400'>
                        {result.failed.length} Failed
                      </div>
                    </div>
                  </div>
                )}
                {result.already_enrolled.length > 0 && (
                  <div className='flex items-center gap-2 rounded-md bg-amber-50 p-3 dark:bg-amber-900/20'>
                    <AlertCircle className='h-4 w-4 text-amber-600' />
                    <div>
                      <div className='font-medium text-amber-700 dark:text-amber-400'>
                        {result.already_enrolled.length} Already enrolled
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {result.failed.length > 0 && (
                <div className='rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/10'>
                  <p className='mb-1 text-xs font-medium text-red-700 dark:text-red-400'>
                    Failed emails:
                  </p>
                  <p className='font-mono text-xs text-red-600'>
                    {result.failed.join(', ')}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
