'use client';

import { useEffect, useState } from 'react';
import { classService } from '@/service/api/v2';
import type { StudentInfo } from '@/service/api/v2/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';

interface StudentRosterProps {
  classId: number;
}

export function StudentRoster({ classId }: StudentRosterProps) {
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    classService.getClassStudents(classId).then((data) => {
      setStudents(data);
      setLoading(false);
    });
  }, [classId]);

  if (loading) {
    return (
      <div className='flex h-32 items-center justify-center'>
        <div className='border-primary h-6 w-6 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className='text-muted-foreground py-12 text-center'>
        <UserPlus className='mx-auto mb-4 h-12 w-12' />
        <p>No students enrolled yet</p>
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className='text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.user_id}>
              <TableCell>
                {student.user_fname || student.user_lname
                  ? `${student.user_fname || ''} ${student.user_lname || ''}`.trim()
                  : 'Unknown'}
              </TableCell>
              <TableCell>{student.user_email}</TableCell>
              <TableCell>{student.user_role}</TableCell>
              <TableCell className='text-right'>
                <Button variant='ghost' size='sm' className='text-destructive'>
                  <UserMinus className='mr-2 h-4 w-4' />
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
