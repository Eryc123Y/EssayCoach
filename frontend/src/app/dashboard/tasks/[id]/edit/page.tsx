'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taskService } from '@/service/api/v2';
import { TaskForm } from '@/features/tasks';
import { TaskSubmissionsTable } from '@/features/tasks';
import type { Task, TaskSubmission } from '@/service/api/v2/types';
import { useAuth } from '@/components/layout/simple-auth-context';

export default function EditTaskPage() {
  const params = useParams();
  const taskId = parseInt(params.id as string);
  const { user } = useAuth();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const userRole = user?.role || 'student';

  useEffect(() => {
    if (taskId) {
      taskService.getTask(taskId).then((data) => {
        setTask(data);
        if (userRole === 'lecturer' || userRole === 'admin') {
          taskService.getTaskSubmissions(taskId).then((subs) => {
            setSubmissions(subs);
            setLoading(false);
          });
        } else {
          setLoading(false);
        }
      });
    }
  }, [taskId, userRole]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!task) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <TaskForm taskId={taskId} initialData={task} />
      
      {(userRole === 'lecturer' || userRole === 'admin') && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Submissions</h2>
          <TaskSubmissionsTable submissions={submissions} />
        </div>
      )}
    </div>
  );
}
