'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )access_token=([^;]+)'));
    const access = match ? match[2] : null;

    if (!access) {
      router.push('/auth/sign-in');
    } else {
      router.push('/dashboard/overview');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Loading EssayCoach...</div>
    </div>
  );
}
