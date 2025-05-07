// src/domains/user/presentation/hooks/useUserSettings.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export type UserSettings = {
  userId: string;
  theme: string;
  language: string;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Завантаження налаштувань користувача
  useEffect(() => {
    const fetchSettings = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch('/api/user/settings', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Помилка завантаження налаштувань');
        }

        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching user settings:', error);
        setError('Не вдалося завантажити налаштування користувача');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  // Оновлення налаштувань користувача
  const updateSettings = async (newSettings: Partial<UserSettings>): Promise<boolean> => {
    if (!user || !settings) return false;

    try {
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(newSettings),
      });

      if (!response.ok) {
        throw new Error('Помилка оновлення налаштувань');
      }

      const updatedSettings = await response.json();
      setSettings(updatedSettings);

      // Якщо змінюється тема, застосовуємо її
      if (newSettings.theme && newSettings.theme !== settings.theme) {
        document.documentElement.classList.toggle('dark', newSettings.theme === 'dark');
      }

      return true;
    } catch (error) {
      console.error('Error updating user settings:', error);
      setError('Не вдалося оновити налаштування користувача');
      return false;
    }
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
  };
}
