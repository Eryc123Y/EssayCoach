'use client';

import { useAuth } from '@/components/layout/simple-auth-context';
import { TaskList } from '@/features/tasks';

export default function TasksPage() {
  const { user } = useAuth();
  const userRole = user?.role || 'student';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <TaskList userRole={userRole} />
    </div>
  );
}
