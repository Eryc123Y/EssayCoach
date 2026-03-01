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
  onChangePassword
}: AccountSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    user_fname: user?.user_fname || '',
    user_lname: user?.user_lname || '',
    user_email: user?.user_email || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirm: ''
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        user_fname: user.user_fname || '',
        user_lname: user.user_lname || '',
        user_email: user.user_email || ''
      });
    }
  }, [user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      const avatarUrl = await onUploadAvatar(file);
      toast.success('Avatar updated successfully');
      // The avatar will be updated via the returned URL
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload avatar'
      );
    }
  };

  const handleSaveUser = async () => {
    setIsSaving(true);
    try {
      await onSaveUser(formData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      );
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
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    try {
      await onChangePassword(
        passwordData.current_password,
        passwordData.new_password,
        passwordData.new_password_confirm
      );
      toast.success('Password changed successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirm: ''
      });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to change password'
      );
    }
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (strength: number) => {
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Medium';
    return 'Strong';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='animate-pulse space-y-4'>
            <div className='bg-muted h-10 w-full rounded' />
            <div className='bg-muted h-10 w-full rounded' />
            <div className='bg-muted h-10 w-full rounded' />
          </div>
        </CardContent>
      </Card>
    );
  }

  const initials =
    `${formData.user_fname?.[0] || ''}${formData.user_lname?.[0] || ''}`.toUpperCase();

  return (
    <div className='space-y-6'>
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar Upload */}
          <div className='flex items-center gap-4'>
            <Avatar className='size-20'>
              <AvatarImage src={user?.user_fname ?? undefined} alt='Avatar' />
              <AvatarFallback className='text-lg'>{initials}</AvatarFallback>
            </Avatar>
            <div className='space-y-2'>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleAvatarChange}
              />
              <Button variant='outline' size='sm' onClick={handleAvatarClick}>
                <IconCamera className='mr-2 size-4' />
                Change Avatar
              </Button>
              <p className='text-muted-foreground text-xs'>
                JPG, GIF or PNG. Max size 5MB.
              </p>
            </div>
          </div>

          <Separator />

          {/* Name and Email Form */}
          <div className='space-y-4'>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='space-y-2'>
                <Label htmlFor='first-name'>First Name</Label>
                <Input
                  id='first-name'
                  value={formData.user_fname}
                  onChange={(e) =>
                    setFormData({ ...formData, user_fname: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='last-name'>Last Name</Label>
                <Input
                  id='last-name'
                  value={formData.user_lname}
                  onChange={(e) =>
                    setFormData({ ...formData, user_lname: e.target.value })
                  }
                  disabled={!isEditing}
                />
              </div>
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={formData.user_email}
                onChange={(e) =>
                  setFormData({ ...formData, user_email: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            {isEditing ? (
              <div className='flex gap-2'>
                <Button onClick={handleSaveUser} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      user_fname: user?.user_fname || '',
                      user_lname: user?.user_lname || '',
                      user_email: user?.user_email || ''
                    });
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg font-semibold'>
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {!showPasswordForm ? (
            <Button variant='outline' onClick={() => setShowPasswordForm(true)}>
              <IconLock className='mr-2 size-4' />
              Change Password
            </Button>
          ) : (
            <div className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='current-password'>Current Password</Label>
                <Input
                  id='current-password'
                  type='password'
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value
                    })
                  }
                  placeholder='Enter current password'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='new-password'>New Password</Label>
                <Input
                  id='new-password'
                  type='password'
                  value={passwordData.new_password}
                  onChange={(e) => {
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value
                    });
                    setPasswordStrength(
                      calculatePasswordStrength(e.target.value)
                    );
                  }}
                  placeholder='Enter new password'
                />
                {passwordData.new_password && (
                  <div className='flex items-center gap-2'>
                    <div className='bg-muted flex h-2 flex-1 overflow-hidden rounded-full'>
                      <div
                        className={`h-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`
                        }}
                      />
                    </div>
                    <span className='text-muted-foreground text-xs'>
                      {getPasswordStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='confirm-password'>Confirm New Password</Label>
                <Input
                  id='confirm-password'
                  type='password'
                  value={passwordData.new_password_confirm}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password_confirm: e.target.value
                    })
                  }
                  placeholder='Confirm new password'
                />
              </div>
              <div className='flex gap-2'>
                <Button onClick={handlePasswordChange}>Confirm Change</Button>
                <Button
                  variant='outline'
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      current_password: '',
                      new_password: '',
                      new_password_confirm: ''
                    });
                    setPasswordStrength(0);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
