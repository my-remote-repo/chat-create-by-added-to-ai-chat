// src/shared/hooks/useOfflineMessageQueue.ts
'use client';

import { useEffect, useState } from 'react';
import { useSocketIo } from './useSocketIo';

interface QueuedMessage {
  id: string;
  chatId: string;
  content: string;
  replyToId?: string;
  files?: Array<{ name: string; url: string; size: number; type: string }>;
  createdAt: Date;
}

export function useOfflineMessageQueue() {
  const [offlineQueue, setOfflineQueue] = useState<QueuedMessage[]>([]);
  const { isConnected, emit } = useSocketIo();
  const storageKey = 'chat-offline-queue';

  // Завантаження черги з локального сховища при ініціалізації
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(storageKey);
      if (storedQueue) {
        setOfflineQueue(JSON.parse(storedQueue));
      }
    } catch (err) {
      console.error('Error loading offline queue:', err);
    }
  }, []);

  // Збереження черги в локальне сховище при зміні
  useEffect(() => {
    if (offlineQueue.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(offlineQueue));
      } catch (err) {
        console.error('Error saving offline queue:', err);
      }
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [offlineQueue]);

  // Відправка повідомлень з черги при відновленні підключення
  useEffect(() => {
    const sendQueuedMessages = async () => {
      if (isConnected && offlineQueue.length > 0) {
        console.log(`Attempting to send ${offlineQueue.length} queued messages`);

        // Копіюємо чергу, щоб не змінювати стан під час ітерації
        const queueCopy = [...offlineQueue];
        const newQueue = [...offlineQueue];

        for (const message of queueCopy) {
          try {
            // Відправляємо повідомлення з часом створення
            emit('send-message', {
              tempId: message.id,
              chatId: message.chatId,
              content: message.content,
              replyToId: message.replyToId,
              files: message.files,
              createdAt: message.createdAt,
            });

            // Видаляємо повідомлення з нової черги
            const index = newQueue.findIndex(m => m.id === message.id);
            if (index !== -1) {
              newQueue.splice(index, 1);
            }

            // Чекаємо невеликий час між відправками, щоб не перевантажувати сервер
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error('Error sending queued message:', error);
            // Продовжуємо з наступним повідомленням
          }
        }

        // Оновлюємо чергу
        setOfflineQueue(newQueue);
      }
    };

    sendQueuedMessages();
  }, [isConnected, offlineQueue, emit]);

  // Додавання повідомлення до черги
  const queueMessage = (message: QueuedMessage) => {
    setOfflineQueue(prev => [...prev, message]);
  };

  // Очищення черги
  const clearQueue = () => {
    setOfflineQueue([]);
    localStorage.removeItem(storageKey);
  };

  return {
    queueMessage,
    clearQueue,
    offlineQueue,
  };
}
