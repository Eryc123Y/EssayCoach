'use client';

import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export default function SettingsPage() {
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);
  const [aiTips, setAiTips] = useState(false);

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
          <p className='text-muted-foreground'>
            Manage your account preferences and notifications.
          </p>
        </div>

        <div className='grid gap-6 lg:grid-cols-3'>
          <Card className='flex h-full flex-col border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>Profile</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='display-name'>Display Name</Label>
                <Input id='display-name' placeholder='Your name' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input id='email' type='email' placeholder='name@school.edu' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='role'>Role</Label>
                <Select>
                  <SelectTrigger id='role'>
                    <SelectValue placeholder='Select role' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='student'>Student</SelectItem>
                    <SelectItem value='teacher'>Teacher</SelectItem>
                    <SelectItem value='admin'>Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className='mt-auto w-full'>Save profile</Button>
            </CardContent>
          </Card>

          <Card className='flex h-full flex-col border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>Notifications</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col space-y-4'>
              <div className='flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800'>
                <div>
                  <p className='text-sm font-medium'>Email updates</p>
                  <p className='text-xs text-muted-foreground'>Weekly progress summaries</p>
                </div>
                <Switch checked={emailUpdates} onCheckedChange={setEmailUpdates} />
              </div>
              <div className='flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800'>
                <div>
                  <p className='text-sm font-medium'>Deadline alerts</p>
                  <p className='text-xs text-muted-foreground'>Upcoming submissions reminders</p>
                </div>
                <Switch checked={deadlineAlerts} onCheckedChange={setDeadlineAlerts} />
              </div>
              <div className='flex items-center justify-between gap-4 rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-800'>
                <div>
                  <p className='text-sm font-medium'>AI improvement tips</p>
                  <p className='text-xs text-muted-foreground'>Insights based on recent drafts</p>
                </div>
                <Switch checked={aiTips} onCheckedChange={setAiTips} />
              </div>
              <Button variant='outline' className='mt-auto w-full'>
                Update notifications
              </Button>
            </CardContent>
          </Card>

          <Card className='flex h-full flex-col border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950'>
            <CardHeader>
              <CardTitle className='text-base font-semibold'>Preferences</CardTitle>
            </CardHeader>
            <CardContent className='flex flex-1 flex-col space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='language'>Feedback language</Label>
                <Select>
                  <SelectTrigger id='language'>
                    <SelectValue placeholder='English (US)' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='en-us'>English (US)</SelectItem>
                    <SelectItem value='en-uk'>English (UK)</SelectItem>
                    <SelectItem value='zh-cn'>中文（简体）</SelectItem>
                    <SelectItem value='zh-tw'>中文（繁體）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='tone'>Feedback tone</Label>
                <Select>
                  <SelectTrigger id='tone'>
                    <SelectValue placeholder='Balanced' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='strict'>Strict</SelectItem>
                    <SelectItem value='balanced'>Balanced</SelectItem>
                    <SelectItem value='encouraging'>Encouraging</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='timezone'>Timezone</Label>
                <Select>
                  <SelectTrigger id='timezone'>
                    <SelectValue placeholder='UTC+08:00' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='utc-08'>UTC-08:00</SelectItem>
                    <SelectItem value='utc+00'>UTC+00:00</SelectItem>
                    <SelectItem value='utc+08'>UTC+08:00</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant='outline' className='mt-auto w-full'>
                Save preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
