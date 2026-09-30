'use client';

import { useEffect, useState } from 'react';
import { classService } from '@/service/api/v2';
import type { StudentInfo } from '@/service/api/v2/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus } from 'lucide-react';
import { usePreferences } from '@/components/layout/preference-provider';
import { Button } from '@/components/ui/button';
import { localized } from '@/locales';

interface StudentRosterProps {
  classId: number;
  onRosterChange?: () => void;
}

export function StudentRoster({ classId, onRosterChange }: StudentRosterProps) {
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const removeStudent = async (student: StudentInfo) => {
    const name = `${student.user_fname || ''} ${student.user_lname || ''}`.trim() || student.user_email;
    if (!window.confirm(zh
      ? `确定将 ${name} 移出班级吗？已有提交和成绩记录会保留。`
      : `Remove ${name} from this class? Existing submissions and results are retained.`)) return;
    setRemovingId(student.user_id);
    setActionError('');
    try {
      await classService.removeStudentFromClass(classId, student.user_id);
      await classService.getClassStudents(classId).then(setStudents);
      onRosterChange?.();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : (localized(locale, 'ui.couldNotRemoveStudent')));
    } finally {
      setRemovingId(null);
    }
  };

  const loadStudents = () => {
    setLoading(true);
    setError(false);
    classService.getClassStudents(classId).then(setStudents).catch(() => setError(true)).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStudents();
    // The class ID is the only input used by the roster fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  if (loading) {
    return <div className="flex items-center justify-center h-32"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div></div>;
  }

  if (error) return <div className='rounded-lg border p-6 text-center' role='alert'>
    <p>{localized(locale, 'ui.couldNotLoadTheStudentRoster')}</p>
    <Button className='mt-3' variant='outline' onClick={loadStudents}>{localized(locale, 'ui.retry')}</Button>
  </div>;

  if (students.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <UserPlus className="mx-auto h-12 w-12 mb-4" />
        <p>{localized(locale, 'ui.noStudentsEnrolledYet')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      {actionError && <p className='border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800' role='alert'>{actionError}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{localized(locale, 'ui.name')}</TableHead>
            <TableHead>{localized(locale, 'ui.emailcbfd4c')}</TableHead>
            <TableHead>{localized(locale, 'ui.role')}</TableHead>
            <TableHead className='text-right'>{localized(locale, 'ui.action')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.user_id}>
              <TableCell>{student.user_fname || student.user_lname ? `${student.user_fname || ''} ${student.user_lname || ''}`.trim() : (localized(locale, 'ui.unknown'))}</TableCell>
              <TableCell>{student.user_email}</TableCell>
              <TableCell>{student.user_role === 'student' ? (localized(locale, 'ui.student')) : student.user_role}</TableCell>
              <TableCell className='text-right'><Button variant='outline' size='sm' disabled={removingId !== null} onClick={() => void removeStudent(student)}>
                {removingId === student.user_id ? (localized(locale, 'ui.removing')) : (localized(locale, 'ui.remove'))}
              </Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
