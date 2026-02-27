import React from 'react';

export default function OverViewLayout({
  children,
}: {
  children: React.ReactNode;
  submissions: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
  sales: React.ReactNode;
}) {
  // Keep the parallel-route slots declared for route compatibility,
  // while delegating rendering to `page.tsx` for a single source of truth.
  return <>{children}</>;
}
