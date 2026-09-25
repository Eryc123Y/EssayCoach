'use client';

import { useParams } from 'next/navigation';
import { ClassForm } from '@/features/classes';
import { useEffect, useState } from 'react';
import { classService } from '@/service/api/v2';
import type { ClassItem } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';
import { Button } from '@/components/ui/button';

export default function EditClassPage() {
  const params = useParams();
  const classId = parseInt(params.id as string);
  const { locale } = usePreferences();
  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (Number.isFinite(classId)) {
      classService.getClass(classId).then((data) => {
        setClassData(data);
      }).catch(() => setError(true)).finally(() => setLoading(false));
    } else {
      setError(true);
      setLoading(false);
    }
  }, [classId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!classData) return <div className='rounded-xl border p-8 text-center' role='alert'>
    <p>{error ? (locale === 'zh' ? '无法加载班级，请重试。' : 'Could not load this class. Please try again.') : (locale === 'zh' ? '找不到这个班级。' : 'Class not found.')}</p>
    <Button className='mt-4' variant='outline' onClick={() => window.location.reload()}>{locale === 'zh' ? '重试' : 'Retry'}</Button>
  </div>;

  return (
    <div className="container mx-auto p-6">
      <ClassForm classId={classId} initialData={classData} />
    </div>
  );
}
