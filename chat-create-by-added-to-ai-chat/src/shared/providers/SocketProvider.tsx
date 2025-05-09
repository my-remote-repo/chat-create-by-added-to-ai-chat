// src/shared/providers/SocketProvider.tsx
'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => boolean;
  on: (event: string, callback: (...args: any[]) => void) => () => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
  connect: () => {},
  disconnect: () => {},
  emit: () => false,
  on: () => () => {},
  off: () => {},
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const initialized = useRef(false);

  // Ініціалізація сокета один раз на рівні додатку
  useEffect(() => {
    if (!user || initialized.current || socketRef.current) return;

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return;

    console.log('Initializing global Socket.io connection (provider)...');

    const newSocket = io('http://localhost:3001', {
      auth: {
        token: accessToken,
        userId: user?.id,
        userName: user?.name,
        userImage: user?.image,
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
      // Важливе налаштування - зменшити кількість перепідключень
      timeout: 10000,
    });

    // Налаштування подій
    newSocket.on('connect', () => {
      console.log('Socket.io global connected');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', reason => {
      console.log(`Socket.io global disconnected: ${reason}`);
      setIsConnected(false);
    });

    newSocket.on('connect_error', err => {
      console.error('Socket.io global connection error:', err);
      setError(`Connection error: ${err.message}`);
      setIsConnected(false);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);
    initialized.current = true;

    return () => {
      // НЕ відключаємо при розмонтуванні провайдера
      // Це важливий момент - ми зберігаємо з'єднання навіть після розмонтування
    };
  }, [user]);

  // Метод для явного підключення
  const connect = () => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    } else if (!socketRef.current && user) {
      // Реініціалізація, якщо сокет ще не створений
      initialized.current = false;
      // Повторно викликаємо useEffect
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const newSocket = io('http://localhost:3001', {
        auth: {
          token: accessToken,
          userId: user?.id,
          userName: user?.name,
          userImage: user?.image,
        },
        reconnection: true,
      });

      // Налаштування обробників подій
      newSocket.on('connect', () => {
        console.log('Socket.io reconnected manually');
        setIsConnected(true);
        setError(null);
      });

      newSocket.on('disconnect', reason => {
        console.log(`Socket.io disconnected after manual connect: ${reason}`);
        setIsConnected(false);
      });

      newSocket.on('connect_error', err => {
        console.error('Socket.io manual connect error:', err);
        setError(`Connection error: ${err.message}`);
        setIsConnected(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
      initialized.current = true;
    }
  };

  // Метод для відключення
  const disconnect = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.disconnect();
    }
  };

  // Метод для відправки подій
  const emit = (event: string, data: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
      return true;
    }
    return false;
  };

  // Метод для прослуховування подій
  const on = (event: string, callback: (...args: any[]) => void) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  };

  // Метод для скасування прослуховування подій
  const off = (event: string, callback?: (...args: any[]) => void) => {
    if (socketRef.current) {
      if (callback) {
        socketRef.current.off(event, callback);
      } else {
        socketRef.current.off(event);
      }
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        error,
        connect,
        disconnect,
        emit,
        on,
        off,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Хук для використання сокет-контексту
export const useSocket = () => useContext(SocketContext);
