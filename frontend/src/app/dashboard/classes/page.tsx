'use client';

import { ClassList } from '@/features/classes';

export default function ClassesPage() {
  return (
    <div className='container mx-auto space-y-6 p-6'>
      <ClassList />
    </div>
  );
}
