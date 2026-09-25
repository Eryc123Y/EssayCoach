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
  const zh = locale === 'zh';

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
      setError(cause instanceof Error ? cause.message : (zh ? '创建邀请失败' : 'Could not create invitation'));
    } finally {
      setWorking(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{zh ? '邀请讲师' : 'Invite lecturer'}</DialogTitle>
          <DialogDescription>
            {zh ? '创建七天有效的一次性链接。请复制并自行分享给讲师。' :
              'Create a one-time link valid for seven days. Copy and share it with the lecturer.'}
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <Label htmlFor='lecturer-email'>{zh ? '讲师邮箱' : 'Lecturer email'}</Label>
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
                  <Label htmlFor='course-lead'>{zh ? `设为 ${unitName} 的课程负责人` : `Make course lead for ${unitName}`}</Label>
                  <p className='text-muted-foreground text-xs'>
                    {zh ? '课程负责人可以确认和发布这门课的正式成绩。' :
                      'Course leads can confirm and publish formal grades for this course.'}
                  </p>
                </div>
              </div>
            </div>
            {error && <p className='text-sm text-red-600' role='alert'>{error}</p>}
            <DialogFooter>
              <Button variant='outline' onClick={close}>{zh ? '取消' : 'Cancel'}</Button>
              <Button onClick={createLink} disabled={working || !email.trim()}>
                {working ? (zh ? '正在创建…' : 'Creating…') : (zh ? '创建邀请链接' : 'Create invitation link')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <p className='text-sm' role='status'>
              {zh ? `已为 ${result.email} 创建邀请链接。` : `Invitation link created for ${result.email}.`}
            </p>
            <div className='space-y-2'>
              <Label htmlFor='lecturer-invitation-link'>{zh ? '邀请链接' : 'Invitation link'}</Label>
              <div className='flex gap-2'>
                <Input id='lecturer-invitation-link' readOnly value={invitationLink(result.token)} />
                <Button variant='outline' onClick={() => navigator.clipboard.writeText(invitationLink(result.token))}>
                  {zh ? '复制' : 'Copy'}
                </Button>
              </div>
              <p className='text-muted-foreground text-xs'>
                {zh ? '链接只在这里显示一次，请现在保存。' : 'This link is shown once. Save it now.'}
              </p>
            </div>
            <DialogFooter><Button onClick={close}>{zh ? '完成' : 'Done'}</Button></DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
