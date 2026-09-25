'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  IconLanguage,
  IconMoon,
  IconSun,
  IconDeviceLaptop,
} from '@tabler/icons-react';
import type { UserPreferences } from '@/service/api/v2/types';
import { toast } from 'sonner';
import { usePreferences } from '@/components/layout/preference-provider';

interface DisplaySectionProps {
  preferences: UserPreferences | null;
  isLoading: boolean;
  isSaving: boolean;
  onUpdatePreferences: (data: Partial<UserPreferences>) => Promise<void>;
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '简体中文 (Simplified Chinese)' },
];

const THEMES = [
  { value: 'light', label: 'Light', icon: IconSun },
  { value: 'dark', label: 'Dark', icon: IconMoon },
  { value: 'system', label: 'System', icon: IconDeviceLaptop },
] as const;

type ThemeValue = 'light' | 'dark' | 'system';

export function DisplaySection({
  preferences,
  isLoading,
  isSaving,
  onUpdatePreferences,
}: DisplaySectionProps) {
  const { locale, applyLocale, applyTheme } = usePreferences();
  const t = (en: string, zh: string) => locale === 'zh' ? zh : en;
  const [localPrefs, setLocalPrefs] = useState<Partial<UserPreferences>>({});
  const [hasChanges, setHasChanges] = useState(false);

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('Display preferences', '显示偏好')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-full rounded bg-muted" />
            <div className="h-10 w-full rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPrefs = { ...preferences, ...localPrefs };

  const handleThemeChange = (value: ThemeValue) => {
    setLocalPrefs((prev) => ({ ...prev, theme: value }));
    setHasChanges(true);
  };

  const handleLanguageChange = (value: string) => {
    setLocalPrefs((prev) => ({ ...prev, language: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await onUpdatePreferences(localPrefs);
      if (localPrefs.language === 'en' || localPrefs.language === 'zh') applyLocale(localPrefs.language);
      if (localPrefs.theme) applyTheme(localPrefs.theme);
      setLocalPrefs({});
      setHasChanges(false);
      toast.success(t('Display preferences updated', '显示偏好已更新'));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast.error(t('Could not update display preferences', '无法更新显示偏好'));
    }
  };

  const handleReset = () => {
    setLocalPrefs({});
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          {t('Display preferences', '显示偏好')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Language Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <IconLanguage className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">{t('Language', '语言')}</p>
              <p className="text-sm text-muted-foreground">
                {t('Select your preferred language', '选择界面语言')}
              </p>
            </div>
          </div>
          <Select
            value={currentPrefs.language}
            onValueChange={handleLanguageChange}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('Select language', '选择语言')} />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Theme Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
              <IconMoon className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium">{t('Theme', '主题')}</p>
              <p className="text-sm text-muted-foreground">
                {t('Choose your preferred color theme', '选择界面颜色主题')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((theme) => {
              const Icon = theme.icon;
              const isSelected = currentPrefs.theme === theme.value;

              return (
                <button
                  key={theme.value}
                  onClick={() => handleThemeChange(theme.value)}
                  className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Icon
                    className={`size-6 ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {locale === 'zh' ? { light: '浅色', dark: '深色', system: '跟随系统' }[theme.value] : theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? t('Saving…', '保存中…') : t('Save changes', '保存更改')}
            </Button>
            <Button variant="outline" onClick={handleReset}>
              {t('Reset', '重置')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
