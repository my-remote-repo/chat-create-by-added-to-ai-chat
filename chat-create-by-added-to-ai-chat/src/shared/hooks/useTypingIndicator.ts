// src/shared/hooks/useTypingIndicator.ts
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSocketIo } from './useSocketIo';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

export function useTypingIndicator(chatId: string) {
  const { on, off, sendTypingStatus } = useSocketIo();
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingUser>>({});
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingStatusRef = useRef(false);

  // Оновлення стану набору для користувача
  const updateTypingUser = useCallback((userId: string, userName: string, isTyping: boolean) => {
    if (isTyping) {
      // Додати користувача до списку набираючих
      setTypingUsers(prev => ({
        ...prev,
        [userId]: {
          userId,
          userName,
          timestamp: Date.now(),
        },
      }));

      // Очистити попередній таймаут, якщо він є
      if (typingTimeoutRef.current[userId]) {
        clearTimeout(typingTimeoutRef.current[userId]);
      }

      // Встановити новий таймаут для видалення через 5 секунд
      typingTimeoutRef.current[userId] = setTimeout(() => {
        setTypingUsers(prev => {
          const newState = { ...prev };
          delete newState[userId];
          return newState;
        });
      }, 5000);
    } else {
      // Видалити користувача зі списку набираючих
      setTypingUsers(prev => {
        const newState = { ...prev };
        delete newState[userId];
        return newState;
      });

      // Очистити таймаут
      if (typingTimeoutRef.current[userId]) {
        clearTimeout(typingTimeoutRef.current[userId]);
        delete typingTimeoutRef.current[userId];
      }
    }
  }, []);

  // Підписка на події набору тексту
  useEffect(() => {
    const unsubscribe = on('user-typing', data => {
      const { userId, userName, isTyping } = data;
      updateTypingUser(userId, userName, isTyping);
    });

    return () => {
      unsubscribe();
      // Очистити всі таймаути при розмонтуванні
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [on, updateTypingUser]);

  // Метод для відправки статусу набору з дебаунсом
  const setTyping = useCallback(
    (isTyping: boolean) => {
      // Не відправляємо статус, якщо він не змінився
      if (lastTypingStatusRef.current === isTyping) {
        return;
      }

      // Оновлюємо останній статус
      lastTypingStatusRef.current = isTyping;

      // Очищаємо попередній таймер дебаунсу
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Встановлюємо новий таймер дебаунсу
      debounceTimerRef.current = setTimeout(() => {
        sendTypingStatus(chatId, isTyping);

        // Якщо статус "набирає", автоматично очищаємо через 5 секунд
        if (isTyping) {
          debounceTimerRef.current = setTimeout(() => {
            sendTypingStatus(chatId, false);
            lastTypingStatusRef.current = false;
          }, 5000);
        }
      }, 300);
    },
    [chatId, sendTypingStatus]
  );

  // Формування тексту для відображення набираючих користувачів
  const typingMessage = useMemo(() => {
    const typingUsersList = Object.values(typingUsers);

    if (typingUsersList.length === 0) {
      return '';
    }

    if (typingUsersList.length === 1) {
      return `${typingUsersList[0].userName} набирає...`;
    }

    if (typingUsersList.length === 2) {
      return `${typingUsersList[0].userName} та ${typingUsersList[1].userName} набирають...`;
    }

    return `${typingUsersList.length} користувачів набирають...`;
  }, [typingUsers]);

  return {
    typingUsers: Object.values(typingUsers),
    typingMessage,
    setTyping,
  };
}
