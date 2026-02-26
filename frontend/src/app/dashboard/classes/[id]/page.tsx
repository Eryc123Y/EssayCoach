'use client';

import { useParams } from 'next/navigation';
import { ClassDetail } from '@/features/classes';

export default function ClassDetailPage() {
  return (
    <div className="container mx-auto p-6">
      <ClassDetail />
    </div>
  );
}
