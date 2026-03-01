'use client';

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisibilityToggleProps {
  visibility: 'public' | 'private';
  onToggle: (visibility: 'public' | 'private') => void;
  disabled?: boolean;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function VisibilityToggle({
  visibility,
  onToggle,
  disabled = false,
  showLabel = true,
  size = 'md'
}: VisibilityToggleProps) {
  const isPublic = visibility === 'public';

  const handleToggle = (checked: boolean) => {
    onToggle(checked ? 'public' : 'private');
  };

  const sizeClasses = {
    sm: 'gap-2 text-xs',
    md: 'gap-3 text-sm',
    lg: 'gap-4 text-base'
  };

  return (
    <div className={cn('flex items-center', sizeClasses[size])}>
      {showLabel && (
        <Label
          htmlFor='visibility-switch'
          className='text-muted-foreground flex items-center gap-2 font-medium'
        >
          {isPublic ? (
            <Globe className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
          ) : (
            <Lock className='h-4 w-4 text-amber-600 dark:text-amber-400' />
          )}
          <span>Visibility</span>
        </Label>
      )}
      <div className='flex items-center gap-2'>
        <Switch
          id='visibility-switch'
          checked={isPublic}
          onCheckedChange={handleToggle}
          disabled={disabled}
          aria-label='Toggle rubric visibility'
        />
        <span
          className={cn(
            'font-medium transition-colors',
            isPublic
              ? 'text-indigo-600 dark:text-indigo-400'
              : 'text-amber-600 dark:text-amber-400'
          )}
        >
          {isPublic ? 'Public' : 'Private'}
        </span>
      </div>
    </div>
  );
}

interface VisibilityBadgeProps {
  visibility: 'public' | 'private';
  size?: 'sm' | 'md';
}

export function VisibilityBadge({
  visibility,
  size = 'sm'
}: VisibilityBadgeProps) {
  const isPublic = visibility === 'public';

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1'
  };

  return (
    <Badge
      variant={isPublic ? 'secondary' : 'outline'}
      className={cn(
        'flex items-center gap-1.5 font-medium',
        isPublic
          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/30'
          : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
        sizeClasses[size]
      )}
    >
      {isPublic ? (
        <>
          <Globe className='h-3 w-3' />
          <span>Public</span>
        </>
      ) : (
        <>
          <Lock className='h-3 w-3' />
          <span>Private</span>
        </>
      )}
    </Badge>
  );
}
