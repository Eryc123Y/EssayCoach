'use client';

import { ReactNode } from 'react';

interface AnimatedTableWrapperProps {
  children: ReactNode;
}

export function AnimatedTableWrapper({ children }: AnimatedTableWrapperProps) {
  return <>{children}</>;
}
