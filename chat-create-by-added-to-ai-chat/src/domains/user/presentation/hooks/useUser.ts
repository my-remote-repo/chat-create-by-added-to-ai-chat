// src/domains/user/presentation/hooks/useUser.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  bio?: string;
  image?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
};

export function useUser() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Завантаження профілю користувача
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const accessToken = localStorage.getItem('accessToken');
        const response = await fetch('/api/user/profile', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Помилка завантаження профілю');
        }

        const data = await response.json();
        setProfile(data);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Не вдалося завантажити профіль користувача');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // Оновлення профілю користувача
  const updateProfile = async (name: string, bio?: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name, bio }),
      });

      if (!response.ok) {
        throw new Error('Помилка оновлення профілю');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);

      // Оновлюємо також в контексті автентифікації
      updateUser({
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        image: updatedProfile.image,
      });

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      setError('Не вдалося оновити профіль користувача');
      return false;
    }
  };

  // Оновлення аватара користувача
  const updateAvatar = async (file: File): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      const accessToken = localStorage.getItem('accessToken');

      // Створюємо FormData для завантаження файлу
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Помилка завантаження аватара');
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);

      // Оновлюємо також в контексті автентифікації
      updateUser({
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        image: updatedProfile.image,
      });

      return true;
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Не вдалося завантажити аватар');
      return false;
    }
  };

  // Оновлення статусу користувача
  const updateStatus = async (status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY'): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch('/api/users/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error('Помилка оновлення статусу');
      }

      // Оновлюємо статус у профілі
      setProfile(prev => (prev ? { ...prev, status } : null));

      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Не вдалося оновити статус');
      return false;
    }
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    updateAvatar,
    updateStatus,
  };
}
