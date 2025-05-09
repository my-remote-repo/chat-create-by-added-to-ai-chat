// src/shared/hooks/useSocketIo.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
// Додайте імпорт
import { debounce } from 'lodash';

interface UseSocketIoOptions {
  autoConnect?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
}

export function useSocketIo(options: UseSocketIoOptions = {}) {
  const { autoConnect = true, reconnectionAttempts = 5, reconnectionDelay = 3000 } = options;

  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);

  // Ініціалізація WebSocket з'єднання
  const initSocket = useCallback(() => {
    if (!isAuthenticated || !user) {
      setError('User not authenticated');
      return null;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('No access token found');
        return null;
      }

      // Створюємо нове з'єднання з незалежним Socket.io сервером
      const socketInstance = io({
        // Замість прямого шляху використовуємо URL-адресу Socket.io сервера
        path: '/api/socketio', // NextJS буде переадресовувати запити на порт 3001
        auth: {
          token: accessToken,
          userId: user.id,
          userName: user.name,
          userImage: user.image,
        },
        reconnection: true,
        reconnectionAttempts,
        reconnectionDelay,
        transports: ['websocket', 'polling'], // Спочатку WebSocket, потім fallback на polling
      });

      // Налаштування обробників подій для стану з'єднання
      socketInstance.on('connect', () => {
        console.log('Socket.io connected');
        setIsConnected(true);
        setError(null);
        reconnectCount.current = 0;
      });

      socketInstance.on('disconnect', reason => {
        console.log(`Socket.io disconnected: ${reason}`);
        setIsConnected(false);
      });

      socketInstance.on('connect_error', err => {
        console.error('Socket.io connection error:', err);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);

        // Спроба переавторизуватися при помилці токена
        if (err.message.includes('token')) {
          // Тут можна викликати функцію оновлення токена
        }
      });

      socketInstance.on('error', errorData => {
        console.error('Socket.io error:', errorData);
        setError(`Error: ${errorData.message || 'Unknown error'}`);
      });

      setSocket(socketInstance);
      return socketInstance;
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError(`Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, [isAuthenticated, user, reconnectionAttempts, reconnectionDelay]);

  // Автоматичне підключення при завантаженні
  useEffect(() => {
    if (autoConnect && isAuthenticated && !socket) {
      const newSocket = initSocket();

      // Очищення при розмонтуванні
      return () => {
        if (newSocket) {
          newSocket.disconnect();
          setSocket(null);
          setIsConnected(false);
        }

        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }
      };
    }
  }, [autoConnect, isAuthenticated, socket, initSocket]);

  // Функція для підключення до сокета
  const connect = useCallback(() => {
    if (!socket && isAuthenticated) {
      initSocket();
    } else if (socket && !socket.connected) {
      socket.connect();
    }
  }, [socket, isAuthenticated, initSocket]);

  // Функція для відключення від сокета
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setIsConnected(false);
    }
  }, [socket]);

  // Функція для повторного підключення
  const reconnect = useCallback(() => {
    disconnect();

    if (reconnectCount.current < reconnectionAttempts) {
      reconnectCount.current += 1;

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }

      reconnectTimer.current = setTimeout(() => {
        console.log(`Reconnecting... Attempt ${reconnectCount.current}/${reconnectionAttempts}`);
        connect();
      }, reconnectionDelay);
    } else {
      setError(`Failed to reconnect after ${reconnectionAttempts} attempts`);
    }
  }, [disconnect, connect, reconnectionAttempts, reconnectionDelay]);

  // Емітер подій
  const emit = useCallback(
    (event: string, data: any, callback?: (response: any) => void) => {
      if (socket && isConnected) {
        socket.emit(event, data, callback);
        return true;
      } else {
        console.warn('Cannot emit - socket not connected');
        return false;
      }
    },
    [socket, isConnected]
  );

  // Підписка на події
  const on = useCallback(
    (event: string, listener: (...args: any[]) => void) => {
      if (socket) {
        socket.on(event, listener);
        return () => {
          socket.off(event, listener);
        };
      }

      return () => {};
    },
    [socket]
  );

  // Відписка від подій
  const off = useCallback(
    (event: string, listener?: (...args: any[]) => void) => {
      if (socket) {
        if (listener) {
          socket.off(event, listener);
        } else {
          socket.off(event);
        }
      }
    },
    [socket]
  );

  // Приєднання до кімнати чату
  const joinChat = useCallback(
    (chatId: string) => {
      if (socket && isConnected) {
        socket.emit('join-chat', chatId);
        return true;
      } else {
        console.warn('Cannot join chat - socket not connected');
        return false;
      }
    },
    [socket, isConnected]
  );

  // Відправка повідомлення
  const sendMessage = useCallback(
    (data: {
      chatId: string;
      content: string;
      replyToId?: string;
      files?: Array<{ name: string; url: string; size: number; type: string }>;
    }) => {
      return emit('send-message', data);
    },
    [emit]
  );

  // Редагування повідомлення
  const editMessage = useCallback(
    (messageId: string, content: string) => {
      return emit('edit-message', { messageId, content });
    },
    [emit]
  );

  // Видалення повідомлення
  const deleteMessage = useCallback(
    (messageId: string) => {
      return emit('delete-message', { messageId });
    },
    [emit]
  );

  // Відправка статусу набору тексту
  const sendTypingStatus = useCallback(
    (chatId: string, isTyping: boolean) => {
      return emit('typing', { chatId, isTyping });
    },
    [emit]
  );

  // Позначення повідомлень як прочитаних
  const markMessagesAsRead = useCallback(
    debounce(
      (chatId: string) => {
        return emit('read-message', { chatId });
      },
      1000,
      { leading: true, trailing: true }
    ),
    [emit]
  );

  // Зміна статусу користувача
  const changeUserStatus = useCallback(
    (status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY') => {
      return emit('change-status', { status });
    },
    [emit]
  );

  return {
    socket,
    isConnected,
    error,
    connect,
    disconnect,
    reconnect,
    emit,
    on,
    off,
    joinChat,
    sendMessage,
    editMessage,
    deleteMessage,
    sendTypingStatus,
    markMessagesAsRead,
    changeUserStatus,
  };
}
