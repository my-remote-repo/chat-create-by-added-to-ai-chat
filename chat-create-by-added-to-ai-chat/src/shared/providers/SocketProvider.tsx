'use client'; // Додайте цей рядок на початку
// src/shared/providers/SocketProvider.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, data: any) => boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
  connect: () => {},
  disconnect: () => {},
  emit: () => false,
});

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const initSocket = () => {
    if (socket) return socket;

    try {
      // Отримання токена
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('No access token found');
        return null;
      }

      console.log('Initializing global Socket.io connection...');

      // Створення сокета
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

      setSocket(newSocket);
      return newSocket;
    } catch (err) {
      console.error('Error initializing socket:', err);
      setError(`Initialization error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      return null;
    }
  };

  // Ініціалізація сокета при монтуванні компонента
  useEffect(() => {
    if (user) {
      initSocket();
    }

    // Не треба відключатися при розмонтуванні
    return () => {};
  }, [user]);

  // Функція для явного підключення
  const connect = () => {
    if (socket && !socket.connected) {
      socket.connect();
    } else if (!socket) {
      initSocket();
    }
  };

  // Функція для відключення
  const disconnect = () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  };

  // Функція для відправки події
  const emit = (event: string, data: any) => {
    if (socket && socket.connected) {
      socket.emit(event, data);
      return true;
    }

    // Спробуємо підключитися
    if (!socket || !socket.connected) {
      connect();
    }

    return false;
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        error,
        connect,
        disconnect,
        emit,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

// Хук для використання сокет-контексту
export const useSocket = () => useContext(SocketContext);
