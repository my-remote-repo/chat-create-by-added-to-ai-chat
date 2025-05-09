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
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const manualDisconnect = useRef(false);

  // Ініціалізація WebSocket - виконується один раз
  const initSocket = useCallback(() => {
    // Запобігаємо повторному створенню сокета
    if (socketRef.current) {
      // Спробуємо повторно підключити якщо відключено
      if (!socketRef.current.connected && !manualDisconnect.current) {
        console.log('Socket exists but disconnected - reconnecting');
        socketRef.current.connect();
      }
      return socketRef.current;
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
      const socket = io('http://localhost:3001', {
        auth: {
          token: accessToken,
          userId: user.id,
          userName: user.name,
          userImage: user.image,
        },
        reconnection: true,
        reconnectionAttempts,
        reconnectionDelay,
      });

      // Налаштовуємо обробники для стану з'єднання
      socket.on('connect', () => {
        console.log('Socket.io connected');
        setIsConnected(true);
        setError(null);
        reconnectCount.current = 0;
        manualDisconnect.current = false;
      });

      socket.on('disconnect', reason => {
        console.log(`Socket.io disconnected: ${reason}`);
        setIsConnected(false);

        // Автоматична спроба повторного підключення, якщо не відключено вручну
        if (!manualDisconnect.current && reconnectCount.current < reconnectionAttempts) {
          reconnectCount.current++;

          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
          }

          reconnectTimer.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect (${reconnectCount.current}/${reconnectionAttempts})`
            );
            socket.connect();
          }, reconnectionDelay);
        }
      });

      socket.on('connect_error', err => {
        console.error('Socket.io connection error:', err);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);

        // Додайте ось цей код для більш інформативної діагностики
        if (err.message.includes('timeout')) {
          console.warn(
            'Socket server might not be running. Please start the socket server using "npm run socket"'
          );
        } else if (err.message.includes('xhr poll error')) {
          console.warn('Network issue or CORS problem. Check server CORS settings.');
        }

        // Також спробуємо повторно підключитися при помилці з'єднання
        if (!manualDisconnect.current && reconnectCount.current < reconnectionAttempts) {
          reconnectCount.current++;

          if (reconnectTimer.current) {
            clearTimeout(reconnectTimer.current);
          }

          reconnectTimer.current = setTimeout(() => {
            console.log(
              `Attempting to reconnect after error (${reconnectCount.current}/${reconnectionAttempts})`
            );
            socket.connect();
          }, reconnectionDelay * reconnectCount.current); // Збільшуємо затримку з кожною спробою
        }
      });

      // Зберігаємо сокет у рефі
      socketRef.current = socket;
      return socket;
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError(`Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  }, [isAuthenticated, user, reconnectionAttempts, reconnectionDelay]);

  // Підключаємось при першому рендері, якщо autoConnect=true
  useEffect(() => {
    let mounted = true;

    const connectSocket = () => {
      if (autoConnect && isAuthenticated && !socketRef.current && mounted) {
        const socket = initSocket();

        if (socket) {
          console.log('Socket connection initialized via useEffect');
        }
      }
    };

    // Спробуємо ініціалізувати з'єднання
    connectSocket();

    // Також періодично перевіряємо з'єднання
    const checkInterval = setInterval(() => {
      if (mounted && isAuthenticated && !isConnected && !manualDisconnect.current) {
        console.log('Connection check: socket not connected, trying to reconnect');
        connectSocket();
      }
    }, 10000); // Перевіряємо кожні 10 секунд

    // Очищення при розмонтуванні
    return () => {
      mounted = false;
      clearInterval(checkInterval);

      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        manualDisconnect.current = true; // Позначаємо, що відключення вручну
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }

      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };
  }, [autoConnect, isAuthenticated, initSocket, isConnected]);

  // Явне підключення до сокета
  const connect = useCallback(() => {
    manualDisconnect.current = false; // Скидаємо прапорець ручного відключення

    if (!socketRef.current && isAuthenticated) {
      return initSocket();
    } else if (socketRef.current && !socketRef.current.connected) {
      console.log('Manual reconnection attempt');
      socketRef.current.connect();
      return socketRef.current;
    }
    return socketRef.current;
  }, [isAuthenticated, initSocket]);

  // Відключення від сокета
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Manual disconnection');
      manualDisconnect.current = true; // Позначаємо, що відключення вручну
      socketRef.current.disconnect();
      setIsConnected(false);
    }
  }, []);

  // Приєднання до кімнати чату
  const joinChat = useCallback(
    (chatId: string) => {
      const socket = socketRef.current || connect();
      if (socket && socket.connected) {
        console.log(`Joining chat: ${chatId}`);
        socket.emit('join-chat', chatId);
        return true;
      } else {
        console.warn('Cannot join chat - socket not connected');
        connect(); // Спробуємо підключитися
        return false;
      }
    },
    [connect]
  );

  // Відправка події
  const emit = useCallback(
    (event: string, data: any, callback?: (response: any) => void) => {
      const socket = socketRef.current;
      if (socket && socket.connected) {
        socket.emit(event, data, callback);
        return true;
      } else {
        console.warn(`Cannot emit ${event} - socket not connected`);
        connect(); // Спробуємо підключитися
        return false;
      }
    },
    [connect]
  );

  // Підписка на події
  const on = useCallback(
    (event: string, listener: (...args: any[]) => void) => {
      const socket = socketRef.current || connect();
      if (socket) {
        socket.on(event, listener);
        return () => {
          socket.off(event, listener);
        };
      }
      return () => {};
    },
    [connect]
  );

  // Відписка від подій
  const off = useCallback((event: string, listener?: (...args: any[]) => void) => {
    const socket = socketRef.current;
    if (socket) {
      if (listener) {
        socket.off(event, listener);
      } else {
        socket.off(event);
      }
    }
  }, []);

  return {
    socket: socketRef.current,
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
