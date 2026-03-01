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

export function ClassList() {
  const router = useRouter();
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const userRole = user?.role || 'student';

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const data = await classService.listClasses();
      setClasses(data);
    } catch (error) {
      toast.error('Failed to load classes. Please try again.');
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

  const canCreateClass = userRole === 'lecturer' || userRole === 'admin';
  const canJoinClass = userRole === 'student';

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
          <h1 className='text-3xl font-bold'>Classes</h1>
          <p className='text-muted-foreground mt-1'>
            Manage your classes and students
          </p>
        </div>
        <div className='flex gap-2'>
          {canJoinClass && (
            <Button variant='outline' onClick={() => setShowJoinDialog(true)}>
              Join Class
            </Button>
          )}
          {canCreateClass && (
            <Button onClick={() => router.push('/dashboard/classes/new')}>
              <PlusCircle className='mr-2 h-4 w-4' />
              New Class
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className='relative max-w-sm'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
        <Input
          placeholder='Search classes...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue='active'>
        <TabsList>
          <TabsTrigger value='active'>
            Active ({activeClasses.length})
          </TabsTrigger>
          <TabsTrigger value='archived'>
            Archived ({archivedClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='active' className='mt-4'>
          {activeClasses.length === 0 ? (
            <div className='py-12 text-center'>
              <p className='text-muted-foreground'>No active classes</p>
              {canCreateClass && (
                <Button
                  variant='link'
                  onClick={() => router.push('/dashboard/classes/new')}
                  className='mt-2'
                >
                  Create your first class
                </Button>
              )}
              {canJoinClass && (
                <Button
                  variant='link'
                  onClick={() => setShowJoinDialog(true)}
                  className='mt-2'
                >
                  Join a class with code
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
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value='archived' className='mt-4'>
          {archivedClasses.length === 0 ? (
            <div className='text-muted-foreground py-12 text-center'>
              No archived classes
            </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {archivedClasses.map((cls) => (
                <ClassCard
                  key={cls.class_id}
                  classItem={cls}
                  onUpdate={loadClasses}
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
