// src/domains/user/presentation/hooks/useUserSearch.ts
'use client';

import { useState } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export type UserResult = {
  id: string;
  name: string;
  email: string;
  image?: string;
  status?: string;
};

export function useUserSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Пошук користувачів
  const searchUsers = async (query: string, limit: number = 10): Promise<UserResult[]> => {
    if (!user || query.length < 2) {
      setResults([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Помилка пошуку користувачів');
      }

      const data = await response.json();
      setResults(data);
      return data;
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Не вдалося виконати пошук користувачів');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Отримання користувачів онлайн
  const getOnlineUsers = async (limit: number = 20): Promise<UserResult[]> => {
    if (!user) {
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(`/api/users/online?limit=${limit}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Помилка отримання користувачів онлайн');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching online users:', error);
      setError('Не вдалося отримати список користувачів онлайн');
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    results,
    loading,
    error,
    searchUsers,
    getOnlineUsers,
  };
}
