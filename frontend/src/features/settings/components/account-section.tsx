'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { IconCamera, IconLock } from '@tabler/icons-react';
import { toast } from 'sonner';
import { settingsService } from '@/service/api/v2/auth';
import type { UserInfo } from '@/service/api/v2/types';
import { usePreferences } from '@/components/layout/preference-provider';

interface AccountSectionProps {
  user: UserInfo | null;
  isLoading: boolean;
  onSaveUser: (data: {
    user_fname: string;
    user_lname: string;
    user_email: string;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string>;
  onChangePassword: (
    currentPassword: string,
    newPassword: string,
    newPasswordConfirm: string
  ) => Promise<void>;
}

export function AccountSection({
  user,
  isLoading,
  onSaveUser,
  onUploadAvatar,
  onChangePassword,
}: AccountSectionProps) {
  const { locale } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar ?? undefined);
  const [formData, setFormData] = useState({
    user_fname: user?.user_fname || '',
    user_lname: user?.user_lname || '',
    user_email: user?.user_email || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: '',
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({ user_fname: user.user_fname || '', user_lname: user.user_lname || '', user_email: user.user_email || '' });
      setAvatarUrl(user.avatar ?? undefined);
    }
  }, [user, isEditing]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('Please select an image file', '请选择图片文件'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('Image must be under 5 MB', '图片不能超过 5 MB'));
      return;
    }

    try {
      const nextUrl = await onUploadAvatar(file);
      setAvatarUrl(`${nextUrl}?v=${Date.now()}`);
      toast.success(t('Avatar updated', '头像已更新'));
    } catch (error) {
      console.error('Failed to upload avatar:', error);
    }
  };

  const handleSaveUser = async () => {
    setIsSaving(true);
    try {
      await onSaveUser(formData);
      toast.success(t('Profile updated', '个人资料已更新'));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const calculatePasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = async () => {
    if (passwordData.new_password !== passwordData.new_password_confirm) {
      toast.error(t('Passwords do not match', '两次密码不一致'));
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error(t('Password must be at least 8 characters', '密码至少需要 8 个字符'));
      return;
    }

    try {
      await onChangePassword(
        passwordData.current_password,
        passwordData.new_password,
        passwordData.new_password_confirm
      );
      toast.success(t('Password changed', '密码已更改'));
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirm: '',
      });
      setShowPasswordForm(false);
    } catch (error) {
      console.error('Failed to change password:', error);
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 2) return t('Weak', '弱');
    if (strength <= 3) return t('Medium', '中');
    return t('Strong', '强');
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('Profile information', '个人资料')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-full rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials = `${formData.user_fname?.[0] || ''}${formData.user_lname?.[0] || ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('Profile information', '个人资料')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src={avatarUrl} alt={t('Avatar', '头像')} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button variant="outline" size="sm" onClick={handleAvatarClick}>
                <IconCamera className="mr-2 size-4" />
                {t('Change avatar', '更换头像')}
              </Button>
              <p className="text-xs text-muted-foreground">
                {t('JPG or PNG, up to 5 MB.', 'JPG 或 PNG，最大 5 MB。')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Name and Email Form */}
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">{t('First name', '名')}</Label>
                <Input
                  id="first-name"
                  value={formData.user_fname}
                  onChange={(e) =>
                    setFormData({ ...formData, user_fname: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">{t('Last name', '姓')}</Label>
                <Input
                  id="last-name"
                  value={formData.user_lname}
                  onChange={(e) =>
                    setFormData({ ...formData, user_lname: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('Email', '电子邮箱')}</Label>
              <Input
                id="email"
                type="email"
                value={formData.user_email}
                readOnly
              />
              <p className="text-xs text-muted-foreground">{t('Use the verification form below to change this address.', '请使用下方的验证表单更改邮箱地址。')}</p>
            </div>

            {isEditing ? (
              <div className="flex gap-2">
                <Button onClick={handleSaveUser} disabled={isSaving}>
                  {isSaving ? t('Saving…', '保存中…') : t('Save changes', '保存更改')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      user_fname: user?.user_fname || '',
                      user_lname: user?.user_lname || '',
                      user_email: user?.user_email || '',
                    });
                  }}
                >
                  {t('Cancel', '取消')}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>{t('Edit profile', '编辑资料')}</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            {t('Change password', '更改密码')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showPasswordForm ? (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
            >
              <IconLock className="mr-2 size-4" />
              {t('Change password', '更改密码')}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">{t('Current password', '当前密码')}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  placeholder={t('Enter current password', '输入当前密码')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">{t('New password', '新密码')}</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    });
                    setPasswordStrength(
                      calculatePasswordStrength(e.target.value)
                    );
                  }}
                  placeholder={t('Enter new password', '输入新密码')}
                />
                {passwordData.new_password && (
                  <div className="flex items-center gap-2">
                    <div className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">{t('Confirm new password', '确认新密码')}</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={passwordData.new_password_confirm}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password_confirm: e.target.value,
                    })
                  }
                  placeholder={t('Confirm new password', '再次输入新密码')}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePasswordChange}>{t('Confirm change', '确认更改')}</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      new_password_confirm: '',
                    });
                    setPasswordStrength(0);
                  }}
                >
                  {t('Cancel', '取消')}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
