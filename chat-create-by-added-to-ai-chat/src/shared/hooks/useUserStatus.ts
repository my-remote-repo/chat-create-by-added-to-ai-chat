// src/shared/hooks/useUserStatus.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocketIo } from './useSocketIo';

type UserStatus = 'online' | 'offline' | 'away' | 'busy';

interface UserStatusInfo {
  userId: string;
  status: UserStatus;
  lastSeen?: string;
}

export function useUserStatus() {
  const { on, off, changeUserStatus } = useSocketIo();
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatusInfo>>({});

  // Функція для оновлення статусу користувача
  const updateUserStatus = useCallback((userId: string, status: UserStatus, lastSeen?: string) => {
    setUserStatuses(prev => ({
      ...prev,
      [userId]: {
        userId,
        status,
        lastSeen,
      },
    }));
  }, []);

  // Підписка на події зміни статусу
  useEffect(() => {
    const unsubscribe = on('user-status-changed', data => {
      const { userId, status, lastSeen } = data;
      updateUserStatus(userId, status, lastSeen);
    });

    return () => {
      unsubscribe();
    };
  }, [on, updateUserStatus]);

  // Функція для отримання статусу конкретного користувача
  const getUserStatus = useCallback(
    (userId: string): UserStatusInfo | null => {
      return userStatuses[userId] || null;
    },
    [userStatuses]
  );

  // Функція для зміни власного статусу
  const setMyStatus = useCallback(
    (status: UserStatus) => {
      return changeUserStatus(status.toUpperCase() as any);
    },
    [changeUserStatus]
  );

  return {
    userStatuses,
    getUserStatus,
    setMyStatus,
  };
}
