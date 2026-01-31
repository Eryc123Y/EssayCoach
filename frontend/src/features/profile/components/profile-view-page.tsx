'use client';

import { useAuth } from '@/components/layout/simple-auth-context';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Calendar, Building } from 'lucide-react';

export default function ProfileViewPage() {
  const { user } = useAuth();

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 p-6 md:p-8'>
      <div className='flex flex-col gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-8 md:p-12 dark:border-slate-800 dark:bg-slate-900/50'>
        <h1 className='text-foreground text-4xl font-bold tracking-tight'>
          Account Profile
        </h1>
        <p className='text-muted-foreground max-w-2xl text-lg'>
          Manage your institutional identity and account preferences.
        </p>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        <Card className='bg-card overflow-hidden border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md md:col-span-2 dark:border-slate-800'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400'>
                <User className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-6 sm:grid-cols-2'>
              <div className='space-y-1.5'>
                <label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  First Name
                </label>
                <div className='text-foreground text-base font-medium'>
                  {user?.firstName || 'Not set'}
                </div>
              </div>
              <div className='space-y-1.5'>
                <label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  Last Name
                </label>
                <div className='text-foreground text-base font-medium'>
                  {user?.lastName || 'Not set'}
                </div>
              </div>
              <div className='space-y-1.5 sm:col-span-2'>
                <label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  Email Address
                </label>
                <div className='text-foreground flex items-center gap-2 text-base font-medium'>
                  <Mail className='text-muted-foreground h-4 w-4' />
                  {user?.email}
                </div>
              </div>
              <div className='space-y-1.5'>
                <label className='text-muted-foreground text-xs font-medium tracking-wider uppercase'>
                  Institution
                </label>
                <div className='text-foreground flex items-center gap-2 text-base font-medium'>
                  <Building className='text-muted-foreground h-4 w-4' />
                  EssayCoach Academy
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='border-border/50 bg-background/60 overflow-hidden shadow-sm backdrop-blur-xl transition-all duration-300 hover:shadow-md md:col-span-1'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-xl bg-teal-50 p-2.5 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'>
                <Shield className='h-5 w-5' />
              </div>
              <div>
                <CardTitle>Account Status</CardTitle>
                <CardDescription>Membership & Security</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm font-medium'>
                  Status
                </span>
                <Badge
                  variant='outline'
                  className='border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400'
                >
                  Active
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm font-medium'>
                  Role
                </span>
                <Badge variant='secondary' className='font-medium'>
                  Educator
                </Badge>
              </div>
              <div className='flex items-center justify-between'>
                <span className='text-muted-foreground text-sm font-medium'>
                  Plan
                </span>
                <Badge
                  variant='outline'
                  className='border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
                >
                  Pro
                </Badge>
              </div>
            </div>

            <div className='border-border/50 border-t pt-4'>
              <div className='text-muted-foreground flex items-center gap-2 text-xs'>
                <Calendar className='h-3.5 w-3.5' />
                <span>Member since {formatDate(new Date().toISOString())}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
