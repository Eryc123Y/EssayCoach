import dynamic from 'next/dynamic';

export const AnimatedTableWrapper = dynamic(
  () => import('./animated-table').then((mod) => mod.AnimatedTableWrapper),
  {
    ssr: false,
    loading: () => <div className='space-y-4' />
  }
);
