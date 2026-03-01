'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { taskService } from '@/service/api/v2';
import type { Task } from '@/service/api/v2/types';
import { TaskCard } from './task-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PlusCircle, Search } from 'lucide-react';
import { toast } from 'sonner';

interface TaskListProps {
  userRole: 'student' | 'lecturer' | 'admin';
}

export function TaskList({ userRole }: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter !== 'all') {
        params.task_status = statusFilter;
      }
      const data = await taskService.listTasks(params);
      setTasks(data);
      setError(null);
    } catch (err) {
      toast.error('Failed to load tasks. Please try again.');
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.task_title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const canCreateTask = userRole === 'lecturer' || userRole === 'admin';

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Tasks</h1>
          <p className='text-muted-foreground mt-1'>
            Manage assignments and submissions
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <PlusCircle className='mr-2 h-4 w-4' />
            New Task
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Search tasks...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Filter by status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='draft'>Draft</SelectItem>
            <SelectItem value='published'>Published</SelectItem>
            <SelectItem value='unpublished'>Unpublished</SelectItem>
            <SelectItem value='archived'>Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className='bg-destructive/10 text-destructive rounded-lg p-4'>
          {error}
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>No tasks found</p>
          {canCreateTask && (
            <Button
              variant='link'
              onClick={() => router.push('/dashboard/tasks/new')}
              className='mt-2'
            >
              Create your first task
            </Button>
          )}
        </div>
      ) : (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.task_id}
              task={task}
              userRole={userRole}
              onUpdate={loadTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
