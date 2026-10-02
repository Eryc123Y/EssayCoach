'use client';

import React from 'react';
import { PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBranding } from './branding-provider';

/**
 * The institution's logo tile. The name is always rendered next to it by the
 * caller, so the image is decorative; if it fails to load (or is blocked as
 * mixed content) the tile shows the default glyph instead.
 */
export function BrandMark({ className, iconSize = 19 }: { className?: string; iconSize?: number }) {
  const { logoUrl } = useBranding();
  const [failedUrl, setFailedUrl] = React.useState('');
  const showLogo = logoUrl !== '' && failedUrl !== logoUrl;

  return (
    <span className={cn('grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary text-primary-foreground', className)}>
      {showLogo ? (
        // eslint-disable-next-line @next/next/no-img-element -- admin-supplied URL on any host
        <img src={logoUrl} alt='' referrerPolicy='no-referrer' className='h-full w-full bg-white object-contain' onError={() => setFailedUrl(logoUrl)} />
      ) : (
        <PenLine size={iconSize} aria-hidden='true' />
      )}
    </span>
  );
}

export function BrandName({ className }: { className?: string }) {
  const { name } = useBranding();
  return <span className={className}>{name}</span>;
}
