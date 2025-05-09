// src/shared/hooks/useSocketIo.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

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
  const socketInstanceRef = useRef<Socket | null>(null);

  // Ініціалізація WebSocket - виконується один раз
  const initSocket = useCallback(() => {
    // Запобігаємо повторному створенню сокета
    if (socketInstanceRef.current) {
      return socketInstanceRef.current;
    }

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

      console.log('Initializing Socket.io connection...');

      // Підключаємось до сокета
      const socketInstance = io({
        path: '/api/socketio',
        auth: {
          token: accessToken,
          userId: user.id,
          userName: user.name,
          userImage: user.image,
        },
        reconnection: true,
        reconnectionAttempts,
        reconnectionDelay,
        transports: ['websocket', 'polling'],
      });

      // Налаштовуємо обробники для стану з'єднання
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
      });

      // Зберігаємо сокет у стані та рефі
      setSocket(socketInstance);
      socketInstanceRef.current = socketInstance;
      return socketInstance;
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError(`Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, [isAuthenticated, user, reconnectionAttempts, reconnectionDelay]);

  // Підключаємось при першому рендері, якщо autoConnect=true
  useEffect(() => {
    if (autoConnect && isAuthenticated && !socketInstanceRef.current) {
      const newSocket = initSocket();

      // Очищення при розмонтуванні
      return () => {
        if (newSocket) {
          console.log('Disconnecting socket on cleanup');
          newSocket.disconnect();
          socketInstanceRef.current = null;
          setSocket(null);
          setIsConnected(false);
        }

        if (reconnectTimer.current) {
          clearTimeout(reconnectTimer.current);
        }
      };
    }
  }, [autoConnect, isAuthenticated, initSocket]);

  // Явне підключення до сокета
  const connect = useCallback(() => {
    if (!socketInstanceRef.current && isAuthenticated) {
      return initSocket();
    } else if (socketInstanceRef.current && !socketInstanceRef.current.connected) {
      socketInstanceRef.current.connect();
      return socketInstanceRef.current;
    }
    return socketInstanceRef.current;
  }, [isAuthenticated, initSocket]);

  // Відключення від сокета
  const disconnect = useCallback(() => {
    if (socketInstanceRef.current) {
      socketInstanceRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  // Приєднання до кімнати чату
  const joinChat = useCallback(
    (chatId: string) => {
      const currentSocket = socketInstanceRef.current || connect();
      if (currentSocket && isConnected) {
        console.log(`Joining chat: ${chatId}`);
        currentSocket.emit('join-chat', chatId);
        return true;
      } else {
        console.warn('Cannot join chat - socket not connected');
        return false;
      }
    },
    [connect, isConnected]
  );

  // Відправка події
  const emit = useCallback(
    (event: string, data: any, callback?: (response: any) => void) => {
      const currentSocket = socketInstanceRef.current;
      if (currentSocket && isConnected) {
        currentSocket.emit(event, data, callback);
        return true;
      } else {
        console.warn(`Cannot emit ${event} - socket not connected`);
        return false;
      }
    },
    [isConnected]
  );

  // Підписка на події
  const on = useCallback((event: string, listener: (...args: any[]) => void) => {
    const currentSocket = socketInstanceRef.current;
    if (currentSocket) {
      currentSocket.on(event, listener);
      return () => {
        currentSocket.off(event, listener);
      };
    }
    return () => {};
  }, []);

  // Відписка від подій
  const off = useCallback((event: string, listener?: (...args: any[]) => void) => {
    const currentSocket = socketInstanceRef.current;
    if (currentSocket) {
      if (listener) {
        currentSocket.off(event, listener);
      } else {
        currentSocket.off(event);
      }
    }
  }, []);

  return {
    socket: socketInstanceRef.current,
    isConnected,
    error,
    connect,
    disconnect,
    joinChat,
    emit,
    on,
    off,
  };
}
