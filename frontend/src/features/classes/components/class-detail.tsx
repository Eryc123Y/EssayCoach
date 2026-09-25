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

export function ClassDetail() {
  const params = useParams();
  const classId = parseInt(params.id as string);
  const { user } = useAuth();
  const { locale } = usePreferences();
  const zh = locale === 'zh';
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
    <p>{loadError ? (zh ? '无法加载这个班级，请重试。' : 'Could not load this class. Please try again.') : (zh ? '找不到这个班级。' : 'Class not found.')}</p>
    <Button className='mt-4' variant='outline' onClick={() => window.location.reload()}>{zh ? '重试' : 'Retry'}</Button>
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
            {ownPendingRequest ? (zh ? '离班申请待审核' : 'Leave request pending') : (zh ? '申请离开班级' : 'Request to leave')}
          </Button>}
          {canInviteStudents && (
            <Button variant='outline' size='sm' onClick={() => setBatchEnrollOpen(true)}>
              <UsersRound className='mr-2 h-4 w-4' />
              {zh ? '邀请学生' : 'Invite students'}
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
                {zh ? '邀请讲师' : 'Invite lecturer'}
              </Button>
            </>
          )}
          <Badge
            variant={
              classData.class_status === 'active' ? 'default' : 'secondary'
            }
          >
            {classData.class_status === 'active' ? (zh ? '进行中' : 'Active') : (zh ? '已归档' : 'Archived')}
          </Badge>
        </div>
      </div>
      {leaveError && <div className='rounded-xl border border-destructive/40 p-4 text-sm text-destructive' role='alert'>
        {zh ? '离班申请暂时无法处理，请重试。' : 'Leave requests could not be processed. Please try again.'}
        <Button variant='outline' size='sm' className='ml-3' onClick={loadLeaveRequests}>{zh ? '重试' : 'Retry'}</Button>
      </div>}

      <Tabs defaultValue={canInviteStudents ? 'students' : 'overview'}>
        <TabsList className='max-w-full justify-start overflow-x-auto'>
          {canInviteStudents && <TabsTrigger value='students'>
            <Users className='mr-2 h-4 w-4' />
            {zh ? '学生' : 'Students'}
          </TabsTrigger>}
          <TabsTrigger value='overview'>
            <ClipboardList className='mr-2 h-4 w-4' />
            {zh ? '概览' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value='tasks'>{zh ? '作业' : 'Assignments'} ({tasks.length})</TabsTrigger>
          {canInviteStudents && <TabsTrigger value='leave'>{zh ? '离班申请' : 'Leave requests'} ({pendingRequests.length})</TabsTrigger>}
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
              {zh ? '无法加载班级进度。' : 'Could not load class progress.'}
              <Button size='sm' variant='outline' className='ml-3' onClick={loadAnalytics}>{zh ? '重试' : 'Retry'}</Button>
            </div> : analytics ? <div className='grid gap-3 sm:grid-cols-3'>
              <div className='rounded-xl border bg-background p-4'><p className='text-xs text-muted-foreground'>{zh ? '提交进度' : 'Submission progress'}</p><p className='mt-2 text-2xl font-semibold'>{analytics.completion_rate}%</p></div>
              <div className='rounded-xl border bg-background p-4'><p className='text-xs text-muted-foreground'>{zh ? '已提交文章' : 'Essays submitted'}</p><p className='mt-2 text-2xl font-semibold'>{analytics.submission_count}</p></div>
              <div className='rounded-xl border bg-background p-4'><p className='text-xs text-muted-foreground'>{zh ? '已发布成绩' : 'Results published'}</p><p className='mt-2 text-2xl font-semibold'>{analytics.published_count}</p></div>
            </div> : <p className='rounded-xl border p-4 text-sm text-muted-foreground'>{zh ? '正在加载班级进度…' : 'Loading class progress…'}</p>}
          </div>}
          <Card>
            <CardHeader>
              <CardTitle>{zh ? '班级资料' : 'Class information'}</CardTitle>
              <CardDescription>
                {classData.class_desc || (zh ? '暂无描述' : 'No description')}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              <div>
                <div className='text-muted-foreground text-sm'>{zh ? '加入代码' : 'Join code'}</div>
                <div className='flex flex-wrap items-center gap-3 font-mono text-lg'>
                  <span>{classData.class_join_code || (zh ? '无' : 'N/A')}</span>
                  {classData.class_join_code && <Button size='sm' variant='outline' onClick={() => {
                    void navigator.clipboard.writeText(classData.class_join_code!).then(
                      () => setCopyMessage(zh ? '已复制' : 'Copied'),
                      () => setCopyMessage(zh ? '复制失败' : 'Could not copy'),
                    );
                  }}>{zh ? '复制代码' : 'Copy code'}</Button>}
                </div>
                {copyMessage && <p className='mt-1 text-xs text-muted-foreground' role='status'>{copyMessage}</p>}
              </div>
              <div>
                <div className='text-muted-foreground text-sm'>{zh ? '学期' : 'Term'}</div>
                <div className='text-lg'>
                  {classTermLabel(classData.class_term || '', locale)} {classData.class_year}
                </div>
              </div>
              <div>
                <div className='text-muted-foreground text-sm'>{zh ? '学生' : 'Students'}</div>
                <div className='text-lg'>{classData.class_size}</div>
              </div>
              <div>
                <div className='text-muted-foreground text-sm'>{zh ? '课程' : 'Course'}</div>
                <div className='text-lg'>{classData.unit_id_unit}</div>
              </div>
            </CardContent>
          </Card>
          {canInviteStudents && analytics && analytics.students.length > 0 && <Card className='mt-4'>
            <CardHeader><CardTitle>{zh ? '学生进度' : 'Student progress'}</CardTitle></CardHeader>
            <CardContent className='space-y-2'>{analytics.students.map((student) => <div key={student.user_id} className='flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm'>
              <span>{student.name}</span><span className='text-muted-foreground'>{zh ? '提交' : 'Submitted'} {student.submissions} · {zh ? '已发布' : 'Published'} {student.published_results}</span>
            </div>)}</CardContent>
          </Card>}
        </TabsContent>

        <TabsContent value='tasks' className='mt-4'>
          {tasksError ? <div className='rounded-xl border p-6 text-center' role='alert'>
            <p>{zh ? '无法加载班级作业。' : 'Could not load class assignments.'}</p>
            <Button variant='outline' className='mt-3' onClick={loadTasks}>{zh ? '重试' : 'Retry'}</Button>
          </div> : tasks.length === 0 ? <p className='rounded-xl border p-8 text-center text-sm text-muted-foreground'>{zh ? '这个班级还没有作业。' : 'No assignments for this class yet.'}</p> :
            <div className='grid gap-4 md:grid-cols-2'>{tasks.map((task) => <TaskCard key={task.task_id} task={task} userRole={user?.role === 'admin' || user?.role === 'lecturer' ? user.role : 'student'} onUpdate={loadTasks} />)}</div>}
        </TabsContent>

        {canInviteStudents && <TabsContent value='leave' className='mt-4'>
          {pendingRequests.length === 0 ? <p className='rounded-xl border p-8 text-center text-sm text-muted-foreground'>{zh ? '暂无待审核的离班申请。' : 'No pending leave requests.'}</p> :
            <div className='space-y-3'>{pendingRequests.map((item) => <div key={item.id} className='flex flex-wrap items-center justify-between gap-4 rounded-xl border p-5'>
              <div><p className='font-medium'>{item.student_name}</p><p className='text-sm text-muted-foreground'>{item.reason || (zh ? '未填写原因' : 'No reason given')} · {new Date(item.requested_at).toLocaleString(zh ? 'zh-CN' : 'en-US')}</p></div>
              <div className='flex gap-2'><Button size='sm' variant='outline' disabled={leaveBusy} onClick={() => void decideLeave(item.id, false)}>{zh ? '拒绝' : 'Decline'}</Button><Button size='sm' disabled={leaveBusy} onClick={() => void decideLeave(item.id, true)}>{zh ? '批准离班' : 'Approve leave'}</Button></div>
            </div>)}</div>}
        </TabsContent>}
      </Tabs>

      {user?.role === 'student' && <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent><DialogHeader><DialogTitle>{zh ? '申请离开班级' : 'Request to leave class'}</DialogTitle><DialogDescription>{zh ? '提交后仍保留在班级中，直到任课老师批准。已有提交与成绩记录会保留。' : 'You remain enrolled until teaching staff approve. Your existing submissions and results are retained.'}</DialogDescription></DialogHeader>
          <div className='space-y-2'><Label htmlFor='leave-reason'>{zh ? '原因（可选）' : 'Reason (optional)'}</Label><Textarea id='leave-reason' value={leaveReason} maxLength={1000} onChange={(event) => setLeaveReason(event.target.value)} rows={3} /></div>
          <DialogFooter><Button variant='outline' onClick={() => setLeaveOpen(false)}>{zh ? '取消' : 'Cancel'}</Button><Button disabled={leaveBusy} onClick={() => void submitLeaveRequest()}>{leaveBusy ? (zh ? '提交中…' : 'Submitting…') : (zh ? '提交申请' : 'Submit request')}</Button></DialogFooter>
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
