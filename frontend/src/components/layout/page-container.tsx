import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export default function PageContainer({
  children,
  className,
  scrollable = true
}: {
  children: React.ReactNode;
  className?: string;
  scrollable?: boolean;
}) {
  const contentClassName = cn('flex flex-1 p-4 md:px-6', className);

  return (
    <>
      {scrollable ? (
        <ScrollArea className='h-[calc(100dvh-52px)]'>
          <div className={contentClassName}>{children}</div>
        </ScrollArea>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
    </>
  );
}
