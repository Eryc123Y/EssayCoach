'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classService, taskService } from '@/service/api/v2';
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
import { usePreferences } from '@/components/layout/preference-provider';

interface TaskListProps {
  userRole: 'student' | 'lecturer' | 'admin';
}

export function TaskList({ userRole }: TaskListProps) {
  const router = useRouter();
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [classNames, setClassNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  useEffect(() => {
    classService.listClasses()
      .then((classes) => setClassNames(Object.fromEntries(classes.map((item) => [item.class_id, item.class_name]))))
      .catch(() => {});
  }, []);

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
      toast.error(zh ? '无法加载作业，请重试。' : 'Failed to load assignments. Please try again.');
      setError(zh ? '无法加载作业。' : 'Failed to load assignments.');
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
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>{zh ? '作业' : 'Assignments'}</h1>
          <p className='text-muted-foreground mt-1'>
            {zh ? '查看作业要求、提交与成绩' : 'Manage assignments and submissions'}
          </p>
        </div>
        {canCreateTask && (
          <Button onClick={() => router.push('/dashboard/tasks/new')}>
            <PlusCircle className='mr-2 h-4 w-4' />
            {zh ? '新建作业' : 'New assignment'}
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-4'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder={zh ? '搜索作业…' : 'Search assignments...'}
            aria-label={zh ? '搜索作业' : 'Search assignments'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-10'
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger aria-label={zh ? '按状态筛选' : 'Filter by status'} className='w-[180px]'>
            <SelectValue placeholder={zh ? '按状态筛选' : 'Filter by status'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>{zh ? '所有状态' : 'All statuses'}</SelectItem>
            <SelectItem value='draft'>{zh ? '草稿' : 'Draft'}</SelectItem>
            <SelectItem value='published'>{zh ? '已发布' : 'Published'}</SelectItem>
            <SelectItem value='unpublished'>{zh ? '已撤回' : 'Unpublished'}</SelectItem>
            <SelectItem value='archived'>{zh ? '已归档' : 'Archived'}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <div className='bg-destructive/10 text-destructive rounded-lg p-4' role='alert'>
          {error} <Button variant='outline' size='sm' onClick={() => void loadTasks()}>{zh ? '重试' : 'Retry'}</Button>
        </div>
      )}

      {/* Task List */}
      {!error && filteredTasks.length === 0 ? (
        <div className='py-12 text-center'>
          <p className='text-muted-foreground'>{zh ? '没有找到作业' : 'No assignments found'}</p>
          {canCreateTask && (
            <Button
              variant='link'
              onClick={() => router.push('/dashboard/tasks/new')}
              className='mt-2'
            >
              {zh ? '创建第一个作业' : 'Create your first assignment'}
            </Button>
          )}
        </div>
      ) : !error && (
        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.task_id}
              task={task}
              className={task.class_id_class ? classNames[task.class_id_class] : undefined}
              userRole={userRole}
              onUpdate={loadTasks}
            />
          ))}
        </div>
      )}
    </div>
  );
}
