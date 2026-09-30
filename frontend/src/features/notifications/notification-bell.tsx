'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconBell } from '@tabler/icons-react';
import { notificationService } from '@/service/api/v2/notifications';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let active = true;
    const refresh = () => notificationService.list().then((data) => { if (active) setUnread(data.unread_count); }).catch(() => {});
    void refresh();
    const timer = window.setInterval(() => { void refresh(); }, 30000);
    window.addEventListener('essaycoach:notifications-changed', refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('essaycoach:notifications-changed', refresh);
    };
  }, []);
  return <Link href='/dashboard/notifications' aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} className='relative grid h-9 w-9 place-items-center rounded-full border border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'><IconBell size={19} />{unread > 0 && <span className='absolute -right-1 -top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-teal-600 px-1 text-[10px] font-bold text-white'>{Math.min(unread, 99)}</span>}</Link>;
}
