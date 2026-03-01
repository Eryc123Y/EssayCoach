'use client';

import { useState } from 'react';
import { classService } from '@/service/api/v2';
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

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: () => void;
}

export function JoinClassDialog({
  open,
  onOpenChange,
  onJoin
}: JoinClassDialogProps) {
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a join code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await classService.joinClass(joinCode.trim().toUpperCase());
      onJoin();
      onOpenChange(false);
      setJoinCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to join class. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Class</DialogTitle>
          <DialogDescription>
            Enter the join code provided by your lecturer to enroll in a class.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {error && (
            <div className='bg-destructive/10 text-destructive rounded-lg p-3 text-sm'>
              {error}
            </div>
          )}

          <div className='space-y-2'>
            <Label htmlFor='join-code'>Join Code</Label>
            <Input
              id='join-code'
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder='e.g., ENG101'
              className='text-center text-lg tracking-wider uppercase'
              maxLength={10}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? 'Joining...' : 'Join Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
