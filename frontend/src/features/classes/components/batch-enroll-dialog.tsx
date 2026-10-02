'use client';

import { useState } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { invitationLink, invitationService } from '@/service/api/v2';
import type { BatchStudentInvitationResult } from '@/service/api/v2/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { localized } from '@/locales';

interface BatchEnrollDialogProps {
  classId: number;
  className: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function parseEmails(raw: string): string[] {
  return Array.from(new Set(raw.split(/[\n,;]+/).map((value) => value.trim()).filter(Boolean)));
}

export function BatchEnrollDialog({ classId, className, open, onOpenChange, onSuccess }: BatchEnrollDialogProps) {
  const { locale } = usePreferences();
  const [raw, setRaw] = useState('');
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<BatchStudentInvitationResult | null>(null);
  const [error, setError] = useState('');
  const emails = parseEmails(raw);

  function close() {
    onOpenChange(false);
    setRaw('');
    setResult(null);
    setError('');
  }

  async function createLinks() {
    if (!emails.length) return;
    setWorking(true);
    setError('');
    try {
      const response = await invitationService.batchStudents(classId, emails);
      setResult(response);
      if (response.created.length) onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (localized(locale, 'ui.couldNotCreateInvitations')));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>{localized(locale, 'ui.inviteStudents')}</DialogTitle>
          <DialogDescription>
            {localized(locale, 'ui.createOneTimeLinksForClassNameStudentsJoinAfterAccepting', { name: className })}
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <>
            <div className='space-y-2 py-2'>
              <Label htmlFor='student-emails'>{localized(locale, 'ui.studentEmails')} ({emails.length})</Label>
              <Textarea id='student-emails' value={raw} onChange={(event) => setRaw(event.target.value)} rows={6} placeholder={'student1@example.com\nstudent2@example.com'} />
              <p className='text-muted-foreground text-xs'>{localized(locale, 'ui.separateWithNewlinesCommasOrSemicolonsUpTo')}</p>
            </div>
            {error && <p className='text-sm text-red-600' role='alert'>{error}</p>}
            <DialogFooter>
              <Button variant='outline' onClick={close}>{localized(locale, 'community.cancel')}</Button>
              <Button onClick={createLinks} disabled={working || !emails.length || emails.length > 50}>
                {working ? (localized(locale, 'ui.creating')) : (localized(locale, 'ui.createInvitationLinks'))}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className='text-sm text-muted-foreground' role='status'>
              {localized(locale, 'ui.linksCreatedAndFailed', { created: result.created.length, failed: result.failed.length })}
            </p>
            <div className='max-h-72 space-y-3 overflow-y-auto'>
              {result.created.map((invitation) => (
                <div key={invitation.id} className='rounded-lg border p-3'>
                  <p className='mb-2 text-sm font-medium'>{invitation.email}</p>
                  <div className='flex gap-2'>
                    <input readOnly aria-label={`${invitation.email} invitation link`} value={invitationLink(invitation.token)} className='min-w-0 flex-1 rounded border px-2 py-1 text-xs' />
                    <Button size='sm' variant='outline' onClick={() => navigator.clipboard.writeText(invitationLink(invitation.token))}>{localized(locale, 'ui.copy')}</Button>
                  </div>
                </div>
              ))}
              {result.failed.map((item) => <p key={item.email} className='text-sm text-red-600'>{item.email}: {item.reason}</p>)}
            </div>
            <DialogFooter><Button onClick={close}>{localized(locale, 'ui.done')}</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
