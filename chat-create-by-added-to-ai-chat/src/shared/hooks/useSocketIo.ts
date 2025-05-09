// src/shared/hooks/useSocketIo.ts
'use client';

import { useCallback } from 'react';
import { useSocket } from '../providers/SocketProvider';

interface UseSocketIoOptions {
  autoConnect?: boolean;
}

export function useSocketIo(options: UseSocketIoOptions = {}) {
  const socketContext = useSocket();

  // Цей хук тепер просто передає методи з SocketProvider
  const joinChat = useCallback(
    (chatId: string) => {
      if (socketContext.isConnected) {
        console.log(`Joining chat: ${chatId}`);
        socketContext.emit('join-chat', chatId);
        return true;
      } else {
        console.warn('Cannot join chat - socket not connected');
        socketContext.connect(); // Спробуємо підключитися
        return false;
      }
    },
    [socketContext]
  );

  // Додайте функції для роботи з конкретними особливостями чату
  const sendTypingStatus = useCallback(
    (chatId: string, isTyping: boolean) => {
      return socketContext.emit('typing', {
        chatId,
        isTyping,
      });
    },
    [socketContext]
  );

  const changeUserStatus = useCallback(
    (status: string) => {
      return socketContext.emit('change-status', {
        status,
      });
    },
    [socketContext]
  );

  return {
    socket: socketContext.socket,
    isConnected: socketContext.isConnected,
    error: socketContext.error,
    connect: socketContext.connect,
    disconnect: socketContext.disconnect,
    emit: socketContext.emit,
    on: socketContext.on,
    off: socketContext.off,
    joinChat,
    sendTypingStatus,
    changeUserStatus,
  };
}
