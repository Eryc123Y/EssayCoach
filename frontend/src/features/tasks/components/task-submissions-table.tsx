'use client';

import type { TaskSubmission } from '@/service/api/v2/types';

interface TaskSubmissionsTableProps {
  submissions: TaskSubmission[];
}

export function TaskSubmissionsTable({ submissions }: TaskSubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No submissions yet
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-3 text-left font-medium">Student</th>
            <th className="p-3 text-left font-medium">Submitted</th>
            <th className="p-3 text-left font-medium">Status</th>
            <th className="p-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((submission) => (
            <tr key={submission.submission_id} className="border-b hover:bg-muted/50">
              <td className="p-3">
                <div>
                  <div className="font-medium">{submission.student_name || 'Unknown'}</div>
                  <div className="text-sm text-muted-foreground">{submission.student_email}</div>
                </div>
              </td>
              <td className="p-3">
                {new Date(submission.submission_time).toLocaleString()}
              </td>
              <td className="p-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Submitted
                </span>
              </td>
              <td className="p-3 text-right">
                <a
                  href={`/dashboard/essay-analysis?submission=${submission.submission_id}`}
                  className="text-primary hover:underline text-sm"
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
