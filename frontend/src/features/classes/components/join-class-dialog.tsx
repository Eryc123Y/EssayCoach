'use client';

import { useState } from 'react';
import { classService } from '@/service/api/v2';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferences } from '@/components/layout/preference-provider';

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: () => void;
}

export function JoinClassDialog({ open, onOpenChange, onJoin }: JoinClassDialogProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError(zh ? '请输入加入代码。' : 'Please enter a join code.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await classService.joinClass(joinCode.trim().toUpperCase());
      onJoin();
      onOpenChange(false);
      setJoinCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : (zh ? '加入班级失败，请检查代码。' : 'Failed to join class. Please check the code.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{zh ? '加入班级' : 'Join class'}</DialogTitle>
          <DialogDescription>
            {zh ? '输入讲师提供的加入代码，加入已经受邀注册的班级。' : 'Enter the code from your lecturer to join a class.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg" role='alert'>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="join-code">{zh ? '加入代码' : 'Join code'}</Label>
            <Input
              id="join-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={zh ? '例如：ABC123' : 'e.g. ABC123'}
              className="uppercase tracking-wider text-center text-lg"
              maxLength={10}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {zh ? '取消' : 'Cancel'}
          </Button>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? (zh ? '加入中…' : 'Joining…') : (zh ? '加入班级' : 'Join class')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
