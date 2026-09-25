'use client';

import { useEffect, useState } from 'react';
import { request } from '@/service/request';
import { usePreferences } from '@/components/layout/preference-provider';

type Organization = {
  name: string;
  logo_url: string;
  primary_color: string;
  invite_only: true;
  updated_at: string;
};
const url = '/api/v2/admin/organization/';

export function OrganizationSection() {
  const { locale: language, changeLocale: setLanguage } = usePreferences();
  const [value, setValue] = useState<Organization>();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const t = (en: string, zh: string) => language === 'zh' ? zh : en;
  useEffect(() => {
    request<Organization>({ url }).then(setValue).catch((cause) => setError(String(cause)));
  }, []);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!value) return;
    setSaving(true);
    try {
      const updated = await request<Organization>({
        url, method: 'PUT',
        data: { name: value.name.trim(), logo_url: value.logo_url.trim(), primary_color: value.primary_color },
      });
      setValue(updated);
      setError('');
      setSuccess(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); setSuccess(false); }
    finally { setSaving(false); }
  }

  return <section className='space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900'>
    <div className='flex items-center justify-between gap-3'><div><h3 className='text-lg font-semibold'>{t('Institution branding', '机构品牌设置')}</h3><p className='mt-1 text-sm text-slate-500'>{t('Used for this private local institution.', '用于当前本地私有机构。')}</p></div><button type='button' onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')} className='rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold'>{language === 'en' ? '中文' : 'English'}</button></div>
    {!value && !error && <p className='text-sm text-slate-500'>{t('Loading…', '正在加载…')}</p>}
    {error && <p role='alert' className='rounded-xl bg-red-50 p-3 text-sm text-red-800'>{error}</p>}
    {success && <p role='status' className='rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800'>{t('Organization settings saved.', '机构设置已保存。')}</p>}
    {value && <form onSubmit={save} className='space-y-4'>
      <label className='block text-sm font-semibold'>{t('Institution name', '机构名称')}<input required minLength={2} maxLength={120} value={value.name} onChange={(event) => { setSuccess(false); setValue({ ...value, name: event.target.value }); }} className='mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' /></label>
      <label className='block text-sm font-semibold'>{t('Logo URL', '标志 URL')}<input type='url' value={value.logo_url} onChange={(event) => { setSuccess(false); setValue({ ...value, logo_url: event.target.value }); }} placeholder='https://…' className='mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100' /></label>
      <label className='block text-sm font-semibold'>{t('Primary color', '主题色')}<div className='mt-1 flex items-center gap-3'><input type='color' value={value.primary_color} onChange={(event) => { setSuccess(false); setValue({ ...value, primary_color: event.target.value }); }} className='h-10 w-14 rounded-lg border border-slate-300' /><code className='text-sm'>{value.primary_color}</code></div></label>
      <div className='rounded-xl bg-teal-50 p-4 text-sm text-teal-950 dark:bg-teal-950 dark:text-teal-100'><strong>{t('Invitation-only enrollment', '仅限邀请加入')}</strong><p className='mt-1'>{t('Students and staff join through authorized invitations. Public registration is disabled for this institution.', '学生和教职人员通过授权邀请加入，本机构不开放自行注册。')}</p></div>
      <button type='submit' disabled={saving} className='rounded-full bg-teal-300 px-5 py-2 text-sm font-bold text-slate-950 disabled:opacity-50'>{saving ? t('Saving…', '保存中…') : t('Save branding', '保存品牌设置')}</button>
    </form>}
  </section>;
}
