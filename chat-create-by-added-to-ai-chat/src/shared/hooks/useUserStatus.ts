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
  const { on, off, changeUserStatus, emit, isConnected } = useSocketIo();
  const [userStatuses, setUserStatuses] = useState<Record<string, UserStatusInfo>>({});

  // Додайте консоль лог щоб побачити стан userStatuses при кожному рендері
  console.log('[useUserStatus] Current statuses:', userStatuses);

  const updateUserStatus = useCallback((userId: string, status: UserStatus, lastSeen?: string) => {
    console.log(`[useUserStatus] Updating status for user ${userId} to ${status}`);
    setUserStatuses(prev => {
      const newState = {
        ...prev,
        [userId]: {
          userId,
          status,
          lastSeen,
        },
      };
      console.log('[useUserStatus] New state:', newState);
      return newState;
    });
  }, []);

  // В обробнику подій
  useEffect(() => {
    console.log('[useUserStatus] Setting up user status listeners');

    const handleStatusChange = (data: any) => {
      console.log('[useUserStatus] Status change event received:', data);
      if (data && data.userId && data.status) {
        updateUserStatus(data.userId, data.status, data.lastSeen);
      }
    };

    const unsubscribe = on('user-status-changed', handleStatusChange);

    // Додайте периодичний запит статусів для діагностики
    const intervalId = setInterval(() => {
      if (isConnected) {
        console.log('[useUserStatus] Periodic status request');
        emit('get-all-online-users', {});
      }
    }, 15000); // кожні 15 секунд

    return () => {
      console.log('[useUserStatus] Cleaning up user status listeners');
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [on, updateUserStatus, emit, isConnected]);

  // Запит статусу користувача
  const requestUserStatus = useCallback(
    (userId: string) => {
      if (isConnected) {
        console.log(`Requesting status for user ${userId}`);
        emit('get-user-status', { userId });
      }
    },
    [emit, isConnected]
  );

  // Запит статусів для групи користувачів
  const requestUsersStatus = useCallback(
    (userIds: string[]) => {
      if (isConnected && userIds.length > 0) {
        console.log(`Requesting status for users: ${userIds.join(', ')}`);
        emit('get-users-status', { userIds });
      }
    },
    [emit, isConnected]
  );

  // Підписка на події зміни статусу
  useEffect(() => {
    console.log('Setting up user status listeners');

    const handleStatusChange = (data: any) => {
      console.log('Status change event received:', data);
      if (data && data.userId && data.status) {
        updateUserStatus(data.userId, data.status, data.lastSeen);
      }
    };

    const unsubscribe = on('user-status-changed', handleStatusChange);

    // Запит статусів усіх користувачів при підключенні
    if (isConnected) {
      emit('get-all-online-users', {}); // Додаємо порожній об'єкт як другий аргумент
    }

    return () => {
      console.log('Cleaning up user status listeners');
      unsubscribe();
    };
  }, [on, updateUserStatus, emit, isConnected]);

  // Періодичне оновлення статусів (пінг)
  useEffect(() => {
    if (!isConnected) return;

    // Відправляємо пінг кожні 45 секунд для підтримки статусу "онлайн"
    const pingInterval = setInterval(() => {
      emit('ping', {
        time: Date.now(),
        message: 'Keep-alive ping',
      });
    }, 45000);

    return () => {
      clearInterval(pingInterval);
    };
  }, [emit, isConnected]);

  // Функція для отримання статусу конкретного користувача
  const getUserStatus = useCallback(
    (userId: string): UserStatusInfo | null => {
      const status = userStatuses[userId];
      console.log(`[useUserStatus] Getting status for ${userId}:`, status || 'not found');
      return status || null;
    },
    [userStatuses]
  );

  // Функція для зміни власного статусу
  const setMyStatus = useCallback(
    (status: UserStatus) => {
      console.log('Setting my status to:', status);
      return changeUserStatus(status);
    },
    [changeUserStatus]
  );

  return {
    userStatuses,
    getUserStatus,
    setMyStatus,
    requestUserStatus,
    requestUsersStatus,
  };
}
