'use client';

import { useState } from 'react';
import { classService } from '@/service/api/v2';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePreferences } from '@/components/layout/preference-provider';
import { localized } from '@/locales';

interface JoinClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJoin: () => void;
}

export function JoinClassDialog({ open, onOpenChange, onJoin }: JoinClassDialogProps) {
  const { locale } = usePreferences();
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError(localized(locale, 'ui.pleaseEnterAJoinCode'));
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
      setError(err instanceof Error ? err.message : (localized(locale, 'ui.failedToJoinClassPleaseCheckTheCode')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{localized(locale, 'ui.joinClassd83ce0')}</DialogTitle>
          <DialogDescription>
            {localized(locale, 'ui.enterTheCodeFromYourLecturerToJoin')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg" role='alert'>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="join-code">{localized(locale, 'ui.joinCodea0bbc8')}</Label>
            <Input
              id="join-code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder={localized(locale, 'ui.eGAbc123')}
              className="uppercase tracking-wider text-center text-lg"
              maxLength={10}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {localized(locale, 'community.cancel')}
          </Button>
          <Button onClick={handleJoin} disabled={loading}>
            {loading ? (localized(locale, 'ui.joining')) : (localized(locale, 'ui.joinClassd83ce0'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
