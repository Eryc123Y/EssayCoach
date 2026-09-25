'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { classService } from '@/service/api/v2';
import type { ClassItem } from '@/service/api/v2/types';
import { ClassCard } from './class-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Search } from 'lucide-react';
import { useAuth } from '@/components/layout/simple-auth-context';
import { JoinClassDialog } from './join-class-dialog';
import { toast } from 'sonner';
import { usePreferences } from '@/components/layout/preference-provider';

export function ClassList() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = usePreferences();
  const zh = locale === 'zh';
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [creatableUnitIds, setCreatableUnitIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const userRole = user?.role || 'student';

  useEffect(() => {
    void loadClasses();
    if (user?.role === 'admin' || user?.role === 'lecturer') {
      void classService.listCreatableUnits().then((units) => setCreatableUnitIds(units.map((unit) => unit.unit_id))).catch(() => setCreatableUnitIds([]));
    }
  }, [user?.role]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setLoadError(false);
      const data = await classService.listClasses();
      setClasses(data);
    } catch (error) {
      setLoadError(true);
      toast.error(zh ? '无法加载班级，请重试。' : 'Failed to load classes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredClasses = classes.filter((cls) =>
    cls.class_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeClasses = filteredClasses.filter(
    (c) => c.class_status === 'active'
  );
  const archivedClasses = filteredClasses.filter(
    (c) => c.class_status === 'archived'
  );

  const canJoinClass = userRole === 'student';
  const canCreateClass = creatableUnitIds.length > 0;

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (loadError) {
    return <div className='rounded-xl border p-8 text-center' role='alert'>
      <p>{zh ? '暂时无法加载班级。' : 'Classes could not be loaded.'}</p>
      <Button className='mt-4' variant='outline' onClick={() => void loadClasses()}>{zh ? '重试' : 'Retry'}</Button>
    </div>;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>{zh ? '班级' : 'Classes'}</h1>
          <p className='text-muted-foreground mt-1'>
            {zh ? '查看班级、课程与学生' : 'Manage your classes and students'}
          </p>
        </div>
        <div className='flex gap-2'>
          {canJoinClass && (
            <Button variant='outline' onClick={() => setShowJoinDialog(true)}>
              {zh ? '加入班级' : 'Join Class'}
            </Button>
          )}
          {canCreateClass && (
            <Button onClick={() => router.push('/dashboard/classes/new')}>
              <PlusCircle className='mr-2 h-4 w-4' />
              {zh ? '新建班级' : 'New Class'}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className='relative max-w-sm'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
        <Input
          placeholder={zh ? '搜索班级…' : 'Search classes...'}
          aria-label={zh ? '搜索班级' : 'Search classes'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue='active'>
        <TabsList>
          <TabsTrigger value='active'>
            {zh ? '进行中' : 'Active'} ({activeClasses.length})
          </TabsTrigger>
          <TabsTrigger value='archived'>
            {zh ? '已归档' : 'Archived'} ({archivedClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='active' className='mt-4'>
          {activeClasses.length === 0 ? (
            <div className='py-12 text-center'>
              <p className='text-muted-foreground'>{zh ? '暂无进行中的班级' : 'No active classes'}</p>
              {canCreateClass && (
                <Button
                  variant='link'
                  onClick={() => router.push('/dashboard/classes/new')}
                  className='mt-2'
                >
                  {zh ? '创建第一个班级' : 'Create your first class'}
                </Button>
              )}
              {canJoinClass && (
                <Button
                  variant='link'
                  onClick={() => setShowJoinDialog(true)}
                  className='mt-2'
                >
                  {zh ? '使用邀请码加入班级' : 'Join a class with code'}
                </Button>
              )}
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {activeClasses.map((cls) => (
                <ClassCard
                  key={cls.class_id}
                  classItem={cls}
                  onUpdate={loadClasses}
                  canManage={userRole === 'admin' || userRole === 'lecturer'}
                  canDuplicate={creatableUnitIds.includes(cls.unit_id_unit)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='archived' className='mt-4'>
          {archivedClasses.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center'>
              {zh ? '暂无已归档班级' : 'No archived classes'}
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {archivedClasses.map((cls) => (
                <ClassCard
                  key={cls.class_id}
                  classItem={cls}
                  onUpdate={loadClasses}
                  canManage={userRole === 'admin' || userRole === 'lecturer'}
                  canDuplicate={creatableUnitIds.includes(cls.unit_id_unit)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showJoinDialog && (
        <JoinClassDialog
          open={showJoinDialog}
          onOpenChange={setShowJoinDialog}
          onJoin={loadClasses}
        />
      )}
    </div>
  );
}
