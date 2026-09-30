'use client';

import Link from 'next/link';
import { BrandMark, BrandName } from '@/components/layout/brand-mark';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';

type Preview = {
  email: string;
  role: 'student' | 'lecturer';
  class_name: string | null;
  unit_name: string | null;
  expires_at: string;
};

const copy = {
  en: {
    studentTitle: 'Join your writing class.',
    lecturerTitle: 'Set up your teaching account.',
    studentIntro: 'Your lecturer invited you to this class. Activate your account to see your assignments and start writing.',
    lecturerIntro: 'Your institution invited you to teach in EssayCoach. Activate your account to set up your courses and classes.',
    missingIntro: 'Access starts with an invitation from your lecturer or institution.',
    invitation: 'Your invitation',
    missing: 'Ask your lecturer or administrator for an invitation link.',
    invalid: 'This invitation is invalid or expired. Request a new link.',
    checking: 'Checking invitation…',
    first: 'First name', last: 'Last name', password: 'Password', confirm: 'Confirm password',
    hint: 'Create a password. If you already have an account, enter its current password.',
    mismatch: 'Passwords do not match.', short: 'Use at least 8 characters.',
    activate: 'Activate invitation', working: 'Activating…', signin: 'Already have access? Sign in',
    failed: 'Could not activate this invitation.', expires: 'Expires',
    student: 'Student', lecturer: 'Lecturer', class: 'Class', course: 'Course lead for'
  },
  zh: {
    studentTitle: '加入课程，开始写作。',
    lecturerTitle: '激活你的讲师账号。',
    studentIntro: '讲师已邀请你加入这门课。激活账号后即可查看作业并开始写作。',
    lecturerIntro: '机构已邀请你使用 EssayCoach 授课。激活账号后即可管理课程与班级。',
    missingIntro: '请通过讲师或机构分享的邀请链接进入。',
    invitation: '你的邀请',
    missing: '请联系讲师或管理员获取邀请链接。',
    invalid: '邀请无效或已过期，请获取新链接。',
    checking: '正在核对邀请…',
    first: '名', last: '姓', password: '密码', confirm: '确认密码',
    hint: '新账号请设置密码；已有账号请填写当前密码。',
    mismatch: '两次输入的密码不一致。', short: '密码至少需要 8 个字符。',
    activate: '激活邀请', working: '正在激活…', signin: '已有账号？前往登录',
    failed: '无法激活邀请。', expires: '有效期至',
    student: '学生', lecturer: '讲师', class: '班级', course: '负责课程'
  }
} as const;

const fieldClass = 'mt-2 w-full rounded-xl border border-[#D8DEEA] bg-white px-4 py-3 text-[#19243B] outline-none focus:border-[#365CE6] focus:ring-2 focus:ring-[#365CE6]/15';

export default function SignUpViewPage() {
  const router = useRouter();
  const [locale, setLocale] = useState<'en' | 'zh'>('en');
  const [token, setToken] = useState<string | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');
  const [first, setFirst] = useState('');
  const [last, setLast] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const t = copy[locale];

  useEffect(() => {
    setLocale(navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en');
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const invitationToken = fragment.get('token') || query.get('token');
    setToken(invitationToken);
    if (!invitationToken) {
      setChecking(false);
      return;
    }
    fetch('/api/v2/auth/invitations/preview/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
      body: JSON.stringify({ token: invitationToken })
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('invalid');
        return (await response.json()) as Preview;
      })
      .then(setPreview)
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false));
  }, []);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !preview) return;
    if (password.length < 8) return setError(t.short);
    if (password !== confirm) return setError(t.mismatch);
    setWorking(true);
    setError('');
    try {
      const response = await fetch('/api/v2/auth/register/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ invitation_token: token, first_name: first, last_name: last, password, password_confirm: confirm })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result?.message || t.failed);
      if (result.user) {
        localStorage.setItem('user_data', JSON.stringify({
          id: String(result.user.user_id || result.user.id),
          email: result.user.user_email || result.user.email,
          firstName: result.user.user_fname || result.user.first_name || '',
          lastName: result.user.user_lname || result.user.last_name || '',
          role: result.user.user_role || result.user.role
        }));
        window.dispatchEvent(new Event('essaycoach:user-updated'));
      }
      router.push('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.failed);
    } finally {
      setWorking(false);
    }
  }

  return (
    <main className='min-h-screen bg-[#F5F7FB] px-5 py-7 text-[#19243B] sm:px-8'>
      <div className='mx-auto max-w-5xl'>
        <header className='flex items-center justify-between border-b border-[#DFE5EF] pb-5'>
          <Link href='/' className='flex items-center gap-3 text-xl font-semibold tracking-tight'><BrandMark /><BrandName /></Link>
          <button type='button' onClick={() => setLocale(locale === 'en' ? 'zh' : 'en')} className='rounded-lg border border-[#D8DEEA] bg-white px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-[#365CE6]' aria-label='Switch language / 切换语言'>
            {locale === 'en' ? '中文' : 'English'}
          </button>
        </header>
        <div className='grid gap-10 py-12 md:grid-cols-[1fr_430px] md:gap-16 md:py-20'>
          <section className='max-w-lg pt-2'>
            <h1 className='text-4xl font-semibold leading-tight tracking-tight sm:text-5xl'>
              {preview?.role === 'lecturer' ? t.lecturerTitle : t.studentTitle}
            </h1>
            <p className='mt-5 max-w-md text-base leading-8 text-[#59657C]'>
              {preview?.role === 'lecturer' ? t.lecturerIntro : preview ? t.studentIntro : t.missingIntro}
            </p>
          </section>
          <section className='rounded-2xl border border-[#DFE5EF] bg-white p-6 shadow-[0_14px_45px_rgba(25,36,59,0.04)] sm:p-8'>
            <h2 className='text-xl font-semibold'>{t.invitation}</h2>
            {checking ? <p className='mt-6 text-[#59657C]' role='status'>{t.checking}</p> :
              !token || invalid || !preview ?
                <p className='mt-6 rounded-xl bg-[#F5F7FB] p-4 leading-7 text-[#59657C]' role='alert'>{invalid ? t.invalid : t.missing}</p> :
                <>
                  <div className='mt-6 rounded-xl border border-[#DFE5EF] bg-[#F5F7FB] p-4'>
                    <p className='font-medium'>{preview.email}</p>
                    <p className='mt-1 text-sm text-[#59657C]'>
                      {preview.role === 'student' ? t.student : t.lecturer}
                      {preview.class_name ? ` · ${t.class}: ${preview.class_name}` : ''}
                      {preview.unit_name ? ` · ${t.course}: ${preview.unit_name}` : ''}
                    </p>
                    <p className='mt-2 text-xs text-[#718098]'>{t.expires} {new Date(preview.expires_at).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}</p>
                  </div>
                  <form className='mt-6 space-y-4' onSubmit={activate}>
                    <div className='grid gap-4 sm:grid-cols-2'>
                      <label className='block text-sm font-medium'>{t.first}<input className={fieldClass} value={first} onChange={(event) => setFirst(event.target.value)} autoComplete='given-name' maxLength={20} /></label>
                      <label className='block text-sm font-medium'>{t.last}<input className={fieldClass} value={last} onChange={(event) => setLast(event.target.value)} autoComplete='family-name' maxLength={20} /></label>
                    </div>
                    <label className='block text-sm font-medium'>{t.password}<input className={fieldClass} type='password' value={password} onChange={(event) => setPassword(event.target.value)} autoComplete='new-password' required minLength={8} /></label>
                    <p className='text-xs leading-5 text-[#718098]'>{t.hint}</p>
                    <label className='block text-sm font-medium'>{t.confirm}<input className={fieldClass} type='password' value={confirm} onChange={(event) => setConfirm(event.target.value)} autoComplete='new-password' required minLength={8} /></label>
                    {error && <p className='rounded-lg bg-red-50 p-3 text-sm text-red-700' role='alert'>{error}</p>}
                    <button type='submit' disabled={working} className='w-full rounded-xl bg-[#365CE6] px-4 py-3 font-medium text-white transition hover:bg-[#2949C5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#365CE6] disabled:opacity-60'>{working ? t.working : t.activate}</button>
                  </form>
                </>}
            <Link href='/auth/sign-in' className='mt-7 inline-block text-sm font-medium text-[#365CE6] hover:underline'>{t.signin}</Link>
          </section>
        </div>
      </div>
    </main>
  );
}
