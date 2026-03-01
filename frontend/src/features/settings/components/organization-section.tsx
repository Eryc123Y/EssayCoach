'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { IconBuilding, IconUsers, IconLock } from '@tabler/icons-react';
import { toast } from 'sonner';

export function OrganizationSection() {
  const [orgData, setOrgData] = useState({
    name: 'EssayCoach University',
    logo: '',
    primaryColor: '#3b82f6',
    selfRegistrationEnabled: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // TODO: Implement API call when backend endpoint is ready
    await new Promise((resolve) => setTimeout(resolve, 500));
    toast.success('Organization settings updated');
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Organization Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Organization Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-16">
              <AvatarImage src={orgData.logo} alt="Organization Logo" />
              <AvatarFallback>
                <IconBuilding className="size-6" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                value={orgData.logo}
                onChange={(e) =>
                  setOrgData({ ...orgData, logo: e.target.value })
                }
                placeholder="https://example.com/logo.png"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="org-name">Organization Name</Label>
            <Input
              id="org-name"
              value={orgData.name}
              onChange={(e) =>
                setOrgData({ ...orgData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="primary-color">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primary-color"
                type="color"
                value={orgData.primaryColor}
                onChange={(e) =>
                  setOrgData({ ...orgData, primaryColor: e.target.value })
                }
                className="w-20"
              />
              <Input
                value={orgData.primaryColor}
                onChange={(e) =>
                  setOrgData({ ...orgData, primaryColor: e.target.value })
                }
                className="flex-1"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Branding'}
          </Button>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <IconUsers className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Self-Registration</p>
                <p className="text-sm text-muted-foreground">
                  Allow users to create accounts without invitation
                </p>
              </div>
            </div>
            <Switch
              checked={orgData.selfRegistrationEnabled}
              onCheckedChange={(checked) =>
                setOrgData({ ...orgData, selfRegistrationEnabled: checked })
              }
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <IconLock className="size-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Email Domain Restriction</p>
                <p className="text-sm text-muted-foreground">
                  Only allow emails from specific domains
                </p>
              </div>
            </div>
            <Switch disabled />
          </div>

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
