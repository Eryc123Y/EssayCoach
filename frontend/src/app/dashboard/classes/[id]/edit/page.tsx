'use client';

import { useParams } from 'next/navigation';
import { ClassForm } from '@/features/classes';
import { useEffect, useState } from 'react';
import { classService } from '@/service/api/v2';
import type { ClassItem } from '@/service/api/v2/types';

export default function EditClassPage() {
  const params = useParams();
  const classId = parseInt(params.id as string);
  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (classId) {
      classService.getClass(classId).then((data) => {
        setClassData(data as any);
        setLoading(false);
      });
    }
  }, [classId]);

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (!classData) return null;

  return (
    <div className='container mx-auto p-6'>
      <ClassForm classId={classId} initialData={classData} />
    </div>
  );
}
