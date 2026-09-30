'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { classService, taskService } from '@/service/api/v2';
import type { ClassDetail as ClassDetailData, ClassLeaveRequest, Task } from '@/service/api/v2/types';
import { useAuth } from '@/components/layout/simple-auth-context';
import { StudentRoster } from './student-roster';
import { BatchEnrollDialog } from './batch-enroll-dialog';
import { InviteLecturerDialog } from './invite-lecturer-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList, UserPlus, UsersRound } from 'lucide-react';
import { usePreferences } from '@/components/layout/preference-provider';
import { classTermLabel } from './class-labels';
import { TaskCard } from '@/features/tasks/components/task-card';
import { analyticsService, type ClassAnalytics } from '@/service/api/v2/analytics';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { localized } from '@/locales';

export function ClassDetail() {
  const params = useParams();
  const classId = parseInt(params.id as string);
  const { user } = useAuth();
  const { locale } = usePreferences();
  const isAdmin = user?.role === 'admin';
  const canInviteStudents = isAdmin || user?.role === 'lecturer';
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<ClassDetailData | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [batchEnrollOpen, setBatchEnrollOpen] = useState(false);
  const [inviteLecturerOpen, setInviteLecturerOpen] = useState(false);
  const [rosterVersion, setRosterVersion] = useState(0);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksError, setTasksError] = useState(false);
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState(false);
  const [leaveRequests, setLeaveRequests] = useState<ClassLeaveRequest[]>([]);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveBusy, setLeaveBusy] = useState(false);
  const [leaveError, setLeaveError] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const pendingRequests = leaveRequests.filter((item) => item.status === 'pending');
  const ownPendingRequest = user?.role === 'student' && pendingRequests.length > 0;

  const loadTasks = () => {
    setTasksError(false);
    void taskService.listTasks({ class_id_class: classId }).then(setTasks).catch(() => setTasksError(true));
  };

  const loadLeaveRequests = () => {
    setLeaveError(false);
    void classService.listLeaveRequests(classId).then(setLeaveRequests).catch(() => setLeaveError(true));
  };

  const loadAnalytics = () => {
    if (!canInviteStudents) return;
    setAnalyticsError(false);
    void analyticsService.class(classId).then(setAnalytics).catch(() => setAnalyticsError(true));
  };

  const submitLeaveRequest = async () => {
    setLeaveBusy(true);
    setLeaveError(false);
    try {
      await classService.requestLeave(classId, leaveReason);
      setLeaveOpen(false);
      setLeaveReason('');
      loadLeaveRequests();
    } catch {
      setLeaveError(true);
    } finally {
      setLeaveBusy(false);
    }
  };

  const decideLeave = async (requestId: number, approve: boolean) => {
    setLeaveBusy(true);
    setLeaveError(false);
    try {
      await classService.decideLeave(classId, requestId, approve);
      loadLeaveRequests();
      setClassData(await classService.getClass(classId));
      setRosterVersion((value) => value + 1);
    } catch {
      setLeaveError(true);
    } finally {
      setLeaveBusy(false);
    }
  };

  useEffect(() => {
    if (Number.isFinite(classId)) {
      loadTasks();
      loadLeaveRequests();
      loadAnalytics();
      classService
        .getClass(classId)
        .then((data) => {
          setClassData(data);
        })
        .catch(() => setLoadError(true))
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoadError(true);
      setLoading(false);
    }
  }, [classId]);

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-b-2'></div>
      </div>
    );
  }

  if (!classData) return <div className='rounded-xl border p-8 text-center' role='alert'>
    <p>{loadError ? (localized(locale, 'ui.couldNotLoadThisClassPleaseTryAgain')) : (localized(locale, 'ui.classNotFound'))}</p>
    <Button className='mt-4' variant='outline' onClick={() => window.location.reload()}>{localized(locale, 'ui.retry')}</Button>
  </div>;

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold'>{classData.class_name}</h1>
          <p className='text-muted-foreground'>{classData.unit_name}</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          {user?.role === 'student' && <Button variant='outline' size='sm' disabled={Boolean(ownPendingRequest)} onClick={() => setLeaveOpen(true)}>
            {ownPendingRequest ? (localized(locale, 'ui.leaveRequestPending')) : (localized(locale, 'ui.requestToLeave'))}
          </Button>}
          {canInviteStudents && (
            <Button variant='outline' size='sm' onClick={() => setBatchEnrollOpen(true)}>
              <UsersRound className='mr-2 h-4 w-4' />
              {localized(locale, 'ui.inviteStudents')}
            </Button>
          )}
          {isAdmin && (
            <>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setInviteLecturerOpen(true)}
              >
                <UserPlus className='mr-2 h-4 w-4' />
                {localized(locale, 'ui.inviteLecturer')}
              </Button>
            </>
          )}
          <Badge
            variant={
              classData.class_status === 'active' ? 'default' : 'secondary'
            }
          >
            {classData.class_status === 'active' ? (localized(locale, 'ui.activeb40ce1')) : (localized(locale, 'ui.archived'))}
          </Badge>
        </div>
      </div>
      {leaveError && <div className='rounded-xl border border-destructive/40 p-4 text-sm text-destructive' role='alert'>
        {localized(locale, 'ui.leaveRequestsCouldNotBeProcessedPleaseTry')}
        <Button variant='outline' size='sm' className='ml-3' onClick={loadLeaveRequests}>{localized(locale, 'ui.retry')}</Button>
      </div>}

      <Tabs defaultValue={canInviteStudents ? 'students' : 'overview'}>
        <TabsList className='max-w-full justify-start overflow-x-auto'>
          {canInviteStudents && <TabsTrigger value='students'>
            <Users className='mr-2 h-4 w-4' />
            {localized(locale, 'ui.students6d0190')}
          </TabsTrigger>}
          <TabsTrigger value='overview'>
            <ClipboardList className='mr-2 h-4 w-4' />
            {localized(locale, 'nav.overview')}
          </TabsTrigger>
          <TabsTrigger value='tasks'>{localized(locale, 'ui.assignments')} ({tasks.length})</TabsTrigger>
          {canInviteStudents && <TabsTrigger value='leave'>{localized(locale, 'ui.leaveRequests')} ({pendingRequests.length})</TabsTrigger>}
        </TabsList>

        {canInviteStudents && <TabsContent value='students' className='mt-4'>
          <StudentRoster key={rosterVersion} classId={classId} onRosterChange={() => {
            void classService.getClass(classId).then(setClassData);
            loadAnalytics();
          }} />
        </TabsContent>}

        <TabsContent value='overview' className='mt-4'>
          {canInviteStudents && <div className='mb-4'>
            {analyticsError ? <div role='alert' className='rounded-xl border p-4 text-sm'>
              {localized(locale, 'ui.couldNotLoadClassProgress')}
              <Button size='sm' variant='outline' className='ml-3' onClick={loadAnalytics}>{localized(locale, 'ui.retry')}</Button>
            </div> : analytics ? <div className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-xl border bg-background p-4'><p className='text-xs text-muted-foreground'>{localized(locale, 'ui.submissionProgress')}</p><p className='mt-2 text-2xl font-semibold'>{analytics.completion_rate}%</p></div>
              <div className='rounded-xl border bg-background p-4'><p className='text-xs text-muted-foreground'>{localized(locale, 'ui.essaysSubmitted97bedc')}</p><p className='mt-2 text-2xl font-semibold'>{analytics.submission_count}</p></div>
              <div className='rounded-xl border bg-background p-4'><p className='text-xs text-muted-foreground'>{localized(locale, 'ui.resultsPublished')}</p><p className='mt-2 text-2xl font-semibold'>{analytics.published_count}</p></div>
            </div> : <p className='rounded-xl border p-4 text-sm text-muted-foreground'>{localized(locale, 'ui.loadingClassProgress')}</p>}
          </div>}
          <Card>
            <CardHeader>
              <CardTitle>{localized(locale, 'ui.classInformation')}</CardTitle>
              <CardDescription>
                {classData.class_desc || (localized(locale, 'ui.noDescription'))}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              <div>
                <div className='text-muted-foreground text-sm'>{localized(locale, 'ui.joinCodea0bbc8')}</div>
                <div className='flex flex-wrap items-center gap-3 font-mono text-lg'>
                  <span>{classData.class_join_code || (localized(locale, 'ui.nAb8cd74'))}</span>
                  {classData.class_join_code && <Button size='sm' variant='outline' onClick={() => {
                    void navigator.clipboard.writeText(classData.class_join_code!).then(
                      () => setCopyMessage(localized(locale, 'ui.copied')),
                      () => setCopyMessage(localized(locale, 'ui.couldNotCopy')),
                    );
                  }}>{localized(locale, 'ui.copyCode')}</Button>}
                </div>
                {copyMessage && <p className='mt-1 text-xs text-muted-foreground' role='status'>{copyMessage}</p>}
              </div>
              <div>
                <div className='text-muted-foreground text-sm'>{localized(locale, 'ui.term743be0')}</div>
                <div className='text-lg'>
                  {classTermLabel(classData.class_term || '', locale)} {classData.class_year}
                </div>
              </div>
              <div>
                <div className='text-muted-foreground text-sm'>{localized(locale, 'ui.students6d0190')}</div>
                <div className='text-lg'>{classData.class_size}</div>
              </div>
              <div>
                <div className='text-muted-foreground text-sm'>{localized(locale, 'ui.course')}</div>
                <div className='text-lg'>{classData.unit_id_unit}</div>
              </div>
            </CardContent>
          </Card>
          {canInviteStudents && analytics && analytics.students.length > 0 && <Card className='mt-4'>
            <CardHeader><CardTitle>{localized(locale, 'ui.studentProgress')}</CardTitle></CardHeader>
            <CardContent className='space-y-2'>{analytics.students.map((student) => <div key={student.user_id} className='flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm'>
              <span>{student.name}</span><span className='text-muted-foreground'>{localized(locale, 'ui.submitteda7c339')} {student.submissions} · {localized(locale, 'ui.published')} {student.published_results}</span>
            </div>)}</CardContent>
          </Card>}
        </TabsContent>

        <TabsContent value='tasks' className='mt-4'>
          {tasksError ? <div className='rounded-xl border p-6 text-center' role='alert'>
            <p>{localized(locale, 'ui.couldNotLoadClassAssignments')}</p>
            <Button variant='outline' className='mt-3' onClick={loadTasks}>{localized(locale, 'ui.retry')}</Button>
          </div> : tasks.length === 0 ? <p className='rounded-xl border p-8 text-center text-sm text-muted-foreground'>{localized(locale, 'ui.noAssignmentsForThisClassYet')}</p> :
            <div className='grid gap-4 md:grid-cols-2'>{tasks.map((task) => <TaskCard key={task.task_id} task={task} userRole={user?.role === 'admin' || user?.role === 'lecturer' ? user.role : 'student'} onUpdate={loadTasks} />)}</div>}
        </TabsContent>

        {canInviteStudents && <TabsContent value='leave' className='mt-4'>
          {pendingRequests.length === 0 ? <p className='rounded-xl border p-8 text-center text-sm text-muted-foreground'>{localized(locale, 'ui.noPendingLeaveRequests')}</p> :
            <div className='space-y-3'>{pendingRequests.map((item) => <div key={item.id} className='flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5'>
              <div><p className='font-medium'>{item.student_name}</p><p className='text-sm text-muted-foreground'>{item.reason || (localized(locale, 'ui.noReasonGiven'))} · {new Date(item.requested_at).toLocaleString(localized(locale, 'ui.enUs'))}</p></div>
              <div className='flex gap-2'><Button size='sm' variant='outline' disabled={leaveBusy} onClick={() => void decideLeave(item.id, false)}>{localized(locale, 'ui.decline')}</Button><Button size='sm' disabled={leaveBusy} onClick={() => void decideLeave(item.id, true)}>{localized(locale, 'ui.approveLeave')}</Button></div>
            </div>)}</div>}
        </TabsContent>}
      </Tabs>

      {user?.role === 'student' && <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent><DialogHeader><DialogTitle>{localized(locale, 'ui.requestToLeaveClass')}</DialogTitle><DialogDescription>{localized(locale, 'ui.youRemainEnrolledUntilTeachingStaffApproveYour')}</DialogDescription></DialogHeader>
          <div className='space-y-2'><Label htmlFor='leave-reason'>{localized(locale, 'ui.reasonOptional')}</Label><Textarea id='leave-reason' value={leaveReason} maxLength={1000} onChange={(event) => setLeaveReason(event.target.value)} rows={3} /></div>
          <DialogFooter><Button variant='outline' onClick={() => setLeaveOpen(false)}>{localized(locale, 'community.cancel')}</Button><Button disabled={leaveBusy} onClick={() => void submitLeaveRequest()}>{leaveBusy ? (localized(locale, 'ui.submittingbabc1d')) : (localized(locale, 'ui.submitRequest'))}</Button></DialogFooter>
        </DialogContent>
      </Dialog>}

      {canInviteStudents && (
          <BatchEnrollDialog
            classId={classId}
            className={classData.class_name}
            open={batchEnrollOpen}
            onOpenChange={setBatchEnrollOpen}
            onSuccess={() => setRosterVersion((value) => value + 1)}
          />
      )}
      {isAdmin && (
        <InviteLecturerDialog
          unitId={classData.unit_id_unit}
          unitName={classData.unit_name || classData.unit_id_unit}
          open={inviteLecturerOpen}
          onOpenChange={setInviteLecturerOpen}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
