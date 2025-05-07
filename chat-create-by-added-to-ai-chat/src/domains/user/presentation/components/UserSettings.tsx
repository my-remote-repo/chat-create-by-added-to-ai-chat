// src/domains/user/presentation/components/UserSettings.tsx
'use client';

import { useUserSettings } from '../hooks/useUserSettings';
import { Button } from '@/shared/components/ui/button';
import { useState } from 'react';
import { Spinner } from '@/shared/components/ui/spinner';
import { Switch } from '@/shared/components/ui/switch';
import { useTheme } from 'next-themes';

export function UserSettings() {
  const { settings, updateSettings } = useUserSettings();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { setTheme } = useTheme();

  const handleUpdateSettings = async (key: string, value: any) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await updateSettings({ [key]: value });
      if (result) {
        setSuccessMessage('Налаштування успішно оновлено');

        // Якщо змінюється тема, застосовуємо її
        if (key === 'theme') {
          setTheme(value);
        }
      } else {
        setErrorMessage('Не вдалося оновити налаштування');
      }
    } catch (error) {
      console.error('Settings update error:', error);
      setErrorMessage('Сталася помилка при оновленні налаштувань');
    } finally {
      setIsSubmitting(false);

      // Автоматично приховуємо повідомлення через 3 секунди
      setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 3000);
    }
  };

  if (!settings) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="space-y-4">
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
          <div className="h-12 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">{errorMessage}</div>
      )}

      {successMessage && (
        <div className="bg-green-100 text-green-700 p-3 rounded-md">{successMessage}</div>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Тема</h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={settings.theme === 'light' ? 'default' : 'outline'}
            onClick={() => handleUpdateSettings('theme', 'light')}
            disabled={isSubmitting}
          >
            Світла
          </Button>
          <Button
            variant={settings.theme === 'dark' ? 'default' : 'outline'}
            onClick={() => handleUpdateSettings('theme', 'dark')}
            disabled={isSubmitting}
          >
            Темна
          </Button>
          <Button
            variant={settings.theme === 'system' ? 'default' : 'outline'}
            onClick={() => handleUpdateSettings('theme', 'system')}
            disabled={isSubmitting}
          >
            Системна
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Мова інтерфейсу</h3>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={settings.language === 'uk' ? 'default' : 'outline'}
            onClick={() => handleUpdateSettings('language', 'uk')}
            disabled={isSubmitting}
          >
            Українська
          </Button>
          <Button
            variant={settings.language === 'en' ? 'default' : 'outline'}
            onClick={() => handleUpdateSettings('language', 'en')}
            disabled={isSubmitting}
          >
            English
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Сповіщення</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="notificationsEnabled" className="text-sm">
              Увімкнути сповіщення
            </label>
            <Switch
              id="notificationsEnabled"
              checked={settings.notificationsEnabled}
              onCheckedChange={(checked: boolean) =>
                handleUpdateSettings('notificationsEnabled', checked)
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="soundsEnabled" className="text-sm">
              Звуки сповіщень
            </label>
            <Switch
              id="soundsEnabled"
              checked={settings.soundsEnabled}
              onCheckedChange={(checked: boolean) => handleUpdateSettings('soundsEnabled', checked)}
              disabled={isSubmitting || !settings.notificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="desktopNotifications" className="text-sm">
              Сповіщення на робочому столі
            </label>
            <Switch
              id="desktopNotifications"
              checked={settings.desktopNotifications}
              onCheckedChange={(checked: boolean) =>
                handleUpdateSettings('desktopNotifications', checked)
              }
              disabled={isSubmitting || !settings.notificationsEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="emailNotifications" className="text-sm">
              Сповіщення на email
            </label>
            <Switch
              id="emailNotifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked: boolean) =>
                handleUpdateSettings('emailNotifications', checked)
              }
              disabled={isSubmitting || !settings.notificationsEnabled}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Приватність</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="showReadReceipts" className="text-sm">
              Відображати статус прочитання
            </label>
            <Switch
              id="showReadReceipts"
              checked={settings.showReadReceipts}
              onCheckedChange={(checked: boolean) =>
                handleUpdateSettings('showReadReceipts', checked)
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="flex items-center justify-between">
            <label htmlFor="showOnlineStatus" className="text-sm">
              Відображати статус онлайн
            </label>
            <Switch
              id="showOnlineStatus"
              checked={settings.showOnlineStatus}
              onCheckedChange={(checked: boolean) =>
                handleUpdateSettings('showOnlineStatus', checked)
              }
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}
