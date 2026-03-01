'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { taskService } from '@/service/api/v2';
import { TaskSubmissionsTable } from '@/features/tasks';
import type { Task, TaskSubmission } from '@/service/api/v2/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TaskDetailPage() {
  const params = useParams();
  const taskId = parseInt(params.id as string);
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
      Promise.all([
        taskService.getTask(taskId),
        taskService.getTaskSubmissions(taskId),
      ]).then(([taskData, submissionsData]) => {
        setTask(taskData);
        setSubmissions(submissionsData);
        setLoading(false);
      });
    }
  }, [taskId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!task) return null;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/dashboard/tasks')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tasks
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{task.task_title}</CardTitle>
              <CardDescription>{task.task_desc || 'No description'}</CardDescription>
            </div>
            <Badge>{task.task_status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Instructions</h3>
            <p className="text-muted-foreground whitespace-pre-wrap">{task.task_instructions}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Due Date</div>
              <div className="font-medium">{new Date(task.task_due_datetime).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Unit</div>
              <div className="font-medium">{task.unit_id_unit}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Late Submissions</div>
              <div className="font-medium">{task.task_allow_late_submission ? 'Allowed' : 'Not allowed'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Submissions</div>
              <div className="font-medium">{submissions.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Submissions</CardTitle>
          <CardDescription>{submissions.length} students have submitted</CardDescription>
        </CardHeader>
        <CardContent>
          <TaskSubmissionsTable submissions={submissions} />
        </CardContent>
      </Card>
    </div>
  );
}
