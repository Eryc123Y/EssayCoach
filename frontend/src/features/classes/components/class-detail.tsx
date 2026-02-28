'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { classService } from '@/service/api/v2';
import { useAuth } from '@/components/layout/simple-auth-context';
import { StudentRoster } from './student-roster';
import { BatchEnrollDialog } from './batch-enroll-dialog';
import { InviteLecturerDialog } from './invite-lecturer-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, ClipboardList, UserPlus, UsersRound } from 'lucide-react';

export function ClassDetail() {
  const params = useParams();
  const classId = parseInt(params.id as string);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [batchEnrollOpen, setBatchEnrollOpen] = useState(false);
  const [inviteLecturerOpen, setInviteLecturerOpen] = useState(false);

  useEffect(() => {
    if (classId) {
      classService.getClass(classId).then((data) => {
        setClassData(data);
        setLoading(false);
      });
    }
  }, [classId]);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!classData) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{classData.class_name}</h1>
          <p className="text-muted-foreground">{classData.unit_name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => setBatchEnrollOpen(true)}>
                <UsersRound className="mr-2 h-4 w-4" />
                Batch Enroll
              </Button>
              <Button variant="outline" size="sm" onClick={() => setInviteLecturerOpen(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Lecturer
              </Button>
            </>
          )}
          <Badge variant={classData.class_status === 'active' ? 'default' : 'secondary'}>
            {classData.class_status}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Students
          </TabsTrigger>
          <TabsTrigger value="overview">
            <ClipboardList className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="mt-4">
          <StudentRoster classId={classId} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Information</CardTitle>
              <CardDescription>{classData.class_desc || 'No description'}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Join Code</div>
                <div className="font-mono text-lg">{classData.class_join_code || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Term</div>
                <div className="text-lg">{classData.class_term} {classData.class_year}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Students</div>
                <div className="text-lg">{classData.class_size}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Unit</div>
                <div className="text-lg">{classData.unit_id_unit}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isAdmin && (
        <>
          <BatchEnrollDialog
            classId={classId}
            className={classData.class_name}
            open={batchEnrollOpen}
            onOpenChange={setBatchEnrollOpen}
            onSuccess={() => {}}
          />
          <InviteLecturerDialog
            open={inviteLecturerOpen}
            onOpenChange={setInviteLecturerOpen}
            onSuccess={() => {}}
          />
        </>
      )}
    </div>
  );
}
