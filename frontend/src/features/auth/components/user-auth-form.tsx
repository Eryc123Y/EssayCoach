'use client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl');
  const [loading] = useState(false);
  const router = useRouter();
  const defaultValues = {
    email: 'student@example.com',
    password: 'student123'
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    try {
      const response = await fetch('/api/v2/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.message || 'Request failed');
      }
      
      // Get the response data including user info
      const result = await response.json();
      
      // Store user data in localStorage for auth context
      if (result.user) {
        const userData = {
          id: String(result.user.id || result.user.user_id),
          email: result.user.email || result.user.user_email,
          firstName: result.user.first_name || result.user.user_fname || '',
          lastName: result.user.last_name || result.user.user_lname || '',
          role: (result.user.role || result.user.user_role || 'student') as 'student' | 'lecturer' | 'admin'
        };
        localStorage.setItem('user_data', JSON.stringify(userData));
        window.dispatchEvent(new Event('essaycoach:user-updated'));
      }
      
      toast.success('Signed in successfully');
      const target = callbackUrl || '/dashboard/overview';
      router.push(target);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Sign in failed: ${message}`);
    }
  };


  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-5"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="name@example.com"
                    disabled={loading}
                    className="h-11 border-slate-200 bg-white px-4 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</FormLabel>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    disabled={loading}
                    className="h-11 border-slate-200 bg-white px-4 py-2 text-sm transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-950"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            className="h-11 w-full bg-blue-600 text-sm font-medium text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-2"
            type="submit"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      {/* Quick-fill test accounts for debugging */}
      <div className="mt-6 space-y-3">
        <div className="text-center text-xs text-slate-400">— Quick Test Accounts —</div>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue('email', 'student@example.com');
              form.setValue('password', 'student123');
              toast.success('Student account loaded');
            }}
            className="text-xs"
          >
            Student
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue('email', 'lecturer@example.com');
              form.setValue('password', 'lecturer123');
              toast.success('Lecturer account loaded');
            }}
            className="text-xs"
          >
            Lecturer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              form.setValue('email', 'admin@example.com');
              form.setValue('password', 'admin123');
              toast.success('Admin account loaded');
            }}
            className="text-xs"
          >
            Admin
          </Button>
        </div>
      </div>

      <p className="mt-4 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/sign-up"
          className="font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition-colors dark:text-blue-400"
        >
          Sign up
        </Link>
      </p>
    </>
  );
}
