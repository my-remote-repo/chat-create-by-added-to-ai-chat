// src/domains/chat/presentation/components/ChatRoom.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { MessageList, MessageData } from '@/domains/message/presentation/components/MessageList';
import { MessageInput } from '@/domains/message/presentation/components/MessageInput';
import { useSocketIo } from '@/shared/hooks/useSocketIo';

export function ChatRoom({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageData | null>(null);
  const { authenticatedFetch } = useAuth();
  const router = useRouter();
  const { isConnected, emit } = useSocketIo();
  const lastReadUpdateRef = useRef<number>(0);
  const isFetchingRef = useRef(false);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Функція для позначення повідомлень як прочитаних (з дебаунсом)
  const handleMarkAsRead = useCallback(() => {
    const now = Date.now();
    // Виконуємо не частіше ніж раз на 5 секунд
    if (now - lastReadUpdateRef.current > 5000) {
      lastReadUpdateRef.current = now;
      if (isConnected && chatId) {
        emit('read-message', { chatId });
      }
    }
  }, [chatId, emit, isConnected]);

  useEffect(() => {
    const fetchChatDetails = async () => {
      // Запобігаємо паралельним запитам
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/chat/${chatId}`);

        if (!response) throw new Error('Failed to fetch chat details');

        if (response.ok) {
          const data = await response.json();
          setChat(data);
          // Скидаємо лічильник спроб після успіху
          retryCountRef.current = 0;
        } else {
          throw new Error('Failed to fetch chat details');
        }
      } catch (err) {
        console.error('Error fetching chat details:', err);
        setError('Не вдалося завантажити деталі чату');

        // Збільшуємо час очікування з кожною невдалою спробою (експоненційна затримка)
        retryCountRef.current += 1;
      } finally {
        setLoading(false);
        isFetchingRef.current = false;

        // Очищаємо попередній таймер, якщо він є
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
          fetchTimeoutRef.current = null;
        }
      }
    };

    // Очищаємо всі таймери при розмонтовуванні або зміні chatId
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
  }, [chatId, authenticatedFetch]);

  // Окремий ефект для початкового завантаження та планування інтервалу
  useEffect(() => {
    // Функція для безпечного завантаження з затримкою у разі невдачі
    const loadChatWithBackoff = async () => {
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;

      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/chat/${chatId}`);

        if (!response) throw new Error('Failed to fetch chat details');

        if (response.ok) {
          const data = await response.json();
          setChat(data);
          // Скидаємо лічильник спроб після успіху
          retryCountRef.current = 0;
        } else {
          throw new Error('Failed to fetch chat details');
        }
      } catch (err) {
        console.error('Error fetching chat details:', err);
        setError('Не вдалося завантажити деталі чату');

        // Збільшуємо час очікування з кожною невдалою спробою (експоненційна затримка)
        retryCountRef.current += 1;

        // Плануємо наступну спробу з експоненційною затримкою, але не більше 1 хвилини
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000);

        if (retryCountRef.current < 5) {
          // Максимум 5 спроб
          fetchTimeoutRef.current = setTimeout(() => {
            loadChatWithBackoff();
          }, delay);
        }
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    };

    if (chatId) {
      loadChatWithBackoff();

      // Встановлюємо інтервал для періодичного оновлення статусу прочитання
      const readInterval = setInterval(() => {
        if (chat) {
          // Перевіряємо, чи чат уже завантажено
          handleMarkAsRead();
        }
      }, 30000); // Кожні 30 секунд

      return () => {
        clearInterval(readInterval);
        if (fetchTimeoutRef.current) {
          clearTimeout(fetchTimeoutRef.current);
        }
      };
    }
  }, [chatId, authenticatedFetch, handleMarkAsRead, chat]);

  const handleGoBack = () => {
    router.push('/chat');
  };

  const handleReply = (message: MessageData) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  if (loading && !chat) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="p-4 text-destructive">
        <p>{error}</p>
        <Button variant="outline" onClick={handleGoBack} className="mt-2">
          Повернутися до списку чатів
        </Button>
      </div>
    );
  }

  // Якщо чат ще не завантажено, але є помилка або йде завантаження, показуємо заглушку
  if (!chat) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b flex items-center">
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Button>
          <div className="ml-3 flex-1">
            <div className="h-6 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-24 bg-muted animate-pulse rounded mt-1"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={handleGoBack} className="mr-2 md:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Button>

        <UserAvatar
          src={chat.isGroup ? undefined : chat.otherUser?.image}
          name={chat.name}
          status={chat.isGroup ? undefined : (chat.otherUser?.status as any)}
        />

        <div className="ml-3 flex-1 overflow-hidden">
          <h3 className="font-medium truncate">{chat.name}</h3>
          {!isConnected && <p className="text-xs text-destructive">Офлайн-режим</p>}
          {isConnected && (
            <p className="text-xs text-muted-foreground">
              {chat.isGroup
                ? `${chat.participants.length} учасників`
                : chat.otherUser?.status === 'online'
                  ? 'В мережі'
                  : 'Не в мережі'}
            </p>
          )}
        </div>

        <Button variant="ghost" size="icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <MessageList
          chatId={chatId}
          key={chatId}
          onReplyToMessage={handleReply}
          onMarkAsRead={handleMarkAsRead}
        />
      </div>

      <MessageInput chatId={chatId} replyToMessage={replyTo} onCancelReply={handleCancelReply} />
    </div>
  );
}
