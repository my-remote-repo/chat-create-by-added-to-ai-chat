// src/shared/hooks/useSocketIo.ts
'use client';

import { useCallback } from 'react';
import { useSocket } from '../providers/SocketProvider';

interface UseSocketIoOptions {
  autoConnect?: boolean;
}

export function useSocketIo(options: UseSocketIoOptions = {}) {
  const socketContext = useSocket();

  // Додаткові методи для роботи з чатом можна додати тут

  // Метод для надсилання повідомлення через сокет
  const sendChatMessage = useCallback(
    (data: {
      chatId: string;
      content: string;
      replyToId?: string;
      files?: Array<{
        name: string;
        url: string;
        size: number;
        type: string;
      }>;
      tempId?: string;
    }) => {
      console.log('Sending message via socket:', data);
      return socketContext.emit('send-message', data);
    },
    [socketContext]
  );

  // Метод для приєднання до чату
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

  // Метод для надсилання статусу набору
  const sendTypingStatus = useCallback(
    (chatId: string, isTyping: boolean) => {
      return socketContext.emit('typing', {
        chatId,
        isTyping,
      });
    },
    [socketContext]
  );

  // Метод для зміни статусу користувача
  const changeUserStatus = useCallback(
    (status: string) => {
      return socketContext.emit('change-status', {
        status,
      });
    },
    [socketContext]
  );

  // Метод для позначення повідомлень як прочитаних
  const markAsRead = useCallback(
    (chatId: string, messageId?: string) => {
      return socketContext.emit('read-message', {
        chatId,
        messageId,
      });
    },
    [socketContext]
  );

  // Метод для перевірки з'єднання
  const pingServer = useCallback(() => {
    if (!socketContext.isConnected) {
      console.warn('Cannot ping - socket not connected');
      return false;
    }

    socketContext.emit('ping', { time: Date.now() });
    return true;
  }, [socketContext]);

  return {
    ...socketContext,
    joinChat,
    sendTypingStatus,
    sendChatMessage,
    changeUserStatus,
    markAsRead,
    pingServer,
  };
}
