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
import { localized } from '@/locales';

export function ClassList() {
  const router = useRouter();
  const { user } = useAuth();
  const { locale } = usePreferences();
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
      toast.error(localized(locale, 'ui.failedToLoadClassesPleaseTryAgain'));
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
      <p>{localized(locale, 'ui.classesCouldNotBeLoaded')}</p>
      <Button className='mt-4' variant='outline' onClick={() => void loadClasses()}>{localized(locale, 'ui.retry')}</Button>
    </div>;
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>{localized(locale, 'ui.classes47c68f')}</h1>
          <p className='text-muted-foreground mt-1'>
            {localized(locale, 'ui.manageYourClassesAndStudents')}
          </p>
        </div>
        <div className='flex gap-2'>
          {canJoinClass && (
            <Button variant='outline' onClick={() => setShowJoinDialog(true)}>
              {localized(locale, 'ui.joinClass')}
            </Button>
          )}
          {canCreateClass && (
            <Button onClick={() => router.push('/dashboard/classes/new')}>
              <PlusCircle className='mr-2 h-4 w-4' />
              {localized(locale, 'nav.newClass')}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className='relative max-w-sm'>
        <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
        <Input
          placeholder={localized(locale, 'ui.searchClassese21b5a')}
          aria-label={localized(locale, 'ui.searchClasses')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='pl-10'
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue='active'>
        <TabsList>
          <TabsTrigger value='active'>
            {localized(locale, 'ui.activeb40ce1')} ({activeClasses.length})
          </TabsTrigger>
          <TabsTrigger value='archived'>
            {localized(locale, 'ui.archived')} ({archivedClasses.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value='active' className='mt-4'>
          {activeClasses.length === 0 ? (
            <div className='py-12 text-center'>
              <p className='text-muted-foreground'>{localized(locale, 'ui.noActiveClassesf1ca27')}</p>
              {canCreateClass && (
                <Button
                  variant='link'
                  onClick={() => router.push('/dashboard/classes/new')}
                  className='mt-2'
                >
                  {localized(locale, 'ui.createYourFirstClass')}
                </Button>
              )}
              {canJoinClass && (
                <Button
                  variant='link'
                  onClick={() => setShowJoinDialog(true)}
                  className='mt-2'
                >
                  {localized(locale, 'ui.joinAClassWithCode')}
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
              {localized(locale, 'ui.noArchivedClasses')}
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
