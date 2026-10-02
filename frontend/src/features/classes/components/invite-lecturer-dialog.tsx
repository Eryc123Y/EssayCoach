'use client';

import { useState } from 'react';
import { usePreferences } from '@/components/layout/preference-provider';
import { invitationLink, invitationService } from '@/service/api/v2';
import type { InvitationCreateResult } from '@/service/api/v2/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { localized } from '@/locales';

interface InviteLecturerDialogProps {
  unitId: string;
  unitName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteLecturerDialog({ unitId, unitName, open, onOpenChange, onSuccess }: InviteLecturerDialogProps) {
  const { locale } = usePreferences();
  const [email, setEmail] = useState('');
  const [courseLead, setCourseLead] = useState(false);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<InvitationCreateResult | null>(null);
  const [error, setError] = useState('');

  function close() {
    onOpenChange(false);
    setEmail('');
    setCourseLead(false);
    setResult(null);
    setError('');
  }

  async function createLink() {
    if (!email.trim()) return;
    setWorking(true);
    setError('');
    try {
      const invitation = await invitationService.create({
        email: email.trim(),
        role: 'lecturer',
        lead_unit_id: courseLead ? unitId : undefined
      });
      setResult(invitation);
      onSuccess();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : (localized(locale, 'ui.couldNotCreateInvitation')));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{localized(locale, 'ui.inviteLecturer')}</DialogTitle>
          <DialogDescription>
            {localized(locale, 'ui.createAOneTimeLinkValidForSeven')}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='lecturer-email'>{localized(locale, 'ui.lecturerEmail')}</Label>
                <Input
                  id='lecturer-email'
                  type='email'
                  autoComplete='email'
                  placeholder='lecturer@university.edu'
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className='flex items-start gap-3 rounded-lg border p-3'>
                <Checkbox
                  id='course-lead'
                  checked={courseLead}
                  onCheckedChange={(checked) => setCourseLead(checked === true)}
                />
                <div className='space-y-1'>
                  <Label htmlFor='course-lead'>{localized(locale, 'ui.makeCourseLeadForUnit', { unit: unitName })}</Label>
                  <p className='text-muted-foreground text-xs'>
                    {localized(locale, 'ui.courseLeadsCanConfirmAndPublishFormalGrades')}
                  </p>
                </div>
              </div>
            </div>
            {error && <p className='text-sm text-red-600' role='alert'>{error}</p>}
            <DialogFooter>
              <Button variant='outline' onClick={close}>{localized(locale, 'community.cancel')}</Button>
              <Button onClick={createLink} disabled={working || !email.trim()}>
                {working ? (localized(locale, 'ui.creating')) : (localized(locale, 'ui.createInvitationLink'))}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className='text-sm' role='status'>
              {localized(locale, 'ui.invitationLinkCreatedForEmail', { email: result.email })}
            </p>
            <div className='space-y-2'>
              <Label htmlFor='lecturer-invitation-link'>{localized(locale, 'ui.invitationLink')}</Label>
              <div className='flex gap-2'>
                <Input id='lecturer-invitation-link' readOnly value={invitationLink(result.token)} />
                <Button variant='outline' onClick={() => navigator.clipboard.writeText(invitationLink(result.token))}>
                  {localized(locale, 'ui.copy')}
                </Button>
              </div>
              <p className='text-muted-foreground text-xs'>
                {localized(locale, 'ui.thisLinkIsShownOnceSaveItNow')}
              </p>
            </div>
            <DialogFooter><Button onClick={close}>{localized(locale, 'ui.done')}</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
