'use client';

import { useState } from 'react';
import { classService } from '@/service/api/v2';
import type { InviteLecturerResult } from '@/service/api/v2/types';
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
import { Loader2, UserPlus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface InviteLecturerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InviteLecturerDialog({
  open,
  onOpenChange,
  onSuccess,
}: InviteLecturerDialogProps) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InviteLecturerResult | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const res = await classService.inviteLecturer({
        email: email.trim(),
        first_name: firstName.trim() || undefined,
        last_name: lastName.trim() || undefined,
      });
      setResult(res);
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to invite lecturer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setEmail('');
    setFirstName('');
    setLastName('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Invite Lecturer
          </DialogTitle>
          <DialogDescription>
            Invite a lecturer by email. A new account will be created if this
            email is not yet registered.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="lecturer-email">Email *</Label>
                <Input
                  id="lecturer-email"
                  type="email"
                  placeholder="lecturer@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="lecturer-fname">First Name</Label>
                  <Input
                    id="lecturer-fname"
                    placeholder="Dr."
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lecturer-lname">Last Name</Label>
                  <Input
                    id="lecturer-lname"
                    placeholder="Smith"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isLoading || !email.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inviting…
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Send Invite
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="h-10 w-10 text-green-500" />
              <div>
                <p className="font-medium">
                  {result.status === 'created'
                    ? 'Lecturer account created'
                    : 'Existing lecturer found'}
                </p>
                <p className="text-sm text-muted-foreground">{result.email}</p>
              </div>
              <p className="text-sm text-muted-foreground">{result.message}</p>
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
