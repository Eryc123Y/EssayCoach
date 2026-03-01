'use client';

import type { TaskSubmission } from '@/service/api/v2/types';

interface TaskSubmissionsTableProps {
  submissions: TaskSubmission[];
}

export function TaskSubmissionsTable({
  submissions
}: TaskSubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className='text-muted-foreground py-8 text-center'>
        No submissions yet
      </div>
    );
  }

  return (
    <div className='rounded-md border'>
      <table className='w-full'>
        <thead>
          <tr className='bg-muted/50 border-b'>
            <th className='p-3 text-left font-medium'>Student</th>
            <th className='p-3 text-left font-medium'>Submitted</th>
            <th className='p-3 text-left font-medium'>Status</th>
            <th className='p-3 text-right font-medium'>Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr
              key={submission.submission_id}
              className='hover:bg-muted/50 border-b'
            >
              <td className='p-3'>
                <div>
                  <div className='font-medium'>
                    {submission.student_name || 'Unknown'}
                  </div>
                  <div className='text-muted-foreground text-sm'>
                    {submission.student_email}
                  </div>
                </div>
              </td>
              <td className='p-3'>
                {new Date(submission.submission_time).toLocaleString()}
              </td>
              <td className='p-3'>
                <span className='inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800'>
                  Submitted
                </span>
              </td>
              <td className='p-3 text-right'>
                <a
                  href={`/dashboard/essay-analysis?submission=${submission.submission_id}`}
                  className='text-primary text-sm hover:underline'
                >
                  View Submission
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
