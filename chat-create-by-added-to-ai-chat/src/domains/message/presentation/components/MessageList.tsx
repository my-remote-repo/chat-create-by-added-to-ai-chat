// src/domains/message/presentation/components/MessageList.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Spinner } from '@/shared/components/ui/spinner';
import { Button } from '@/shared/components/ui/button';
import { formatDate } from '@/lib/utils';
import { MessageItem } from './MessageItem';
import { useSocketIo } from '@/shared/hooks/useSocketIo';
import { useTypingIndicator } from '@/shared/hooks/useTypingIndicator';

// Оригінальний інтерфейс MessageData
export interface MessageData {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  readBy: string[];
  files: any[];
  user?: {
    id: string;
    name: string;
    image?: string | null;
  };
  replyTo?: MessageData | null;
  // Додаткові властивості для клієнтського стану
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'error' | 'offline';
}

interface MessageListProps {
  chatId: string;
  onReplyToMessage?: (message: MessageData) => void;
  onMarkAsRead?: () => void;
}

export function MessageList({ chatId, onReplyToMessage, onMarkAsRead }: MessageListProps) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { user, authenticatedFetch } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, off, emit } = useSocketIo();
  const { typingMessage } = useTypingIndicator(chatId);
  const oldestMessageRef = useRef<string | null>(null);
  const userScrolledUpRef = useRef(false);
  const fetchingMessagesRef = useRef(false);

  // Однократне завантаження повідомлень
  const fetchMessages = useCallback(async () => {
    if (fetchingMessagesRef.current) return;
    fetchingMessagesRef.current = true;

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/chat/${chatId}/messages`);

      if (!response || !response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      const sortedMessages = [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      setMessages(sortedMessages);
      setHasMore(data.length >= 30); // Припускаємо, що ліміт 30

      if (data.length > 0) {
        oldestMessageRef.current = data[0].id;
      }

      if (onMarkAsRead) {
        onMarkAsRead();
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Не вдалося завантажити повідомлення');
    } finally {
      setLoading(false);
      fetchingMessagesRef.current = false;

      // Прокрутка до останнього повідомлення
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [chatId, authenticatedFetch, onMarkAsRead]);

  // Завантаження старіших повідомлень при прокрутці
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !oldestMessageRef.current) return;

    try {
      setLoadingMore(true);
      const response = await authenticatedFetch(
        `/api/chat/${chatId}/messages?cursor=${oldestMessageRef.current}`
      );

      if (!response || !response.ok) {
        throw new Error('Failed to load more messages');
      }

      const data = await response.json();

      if (data.length > 0) {
        // Додаємо тільки унікальні повідомлення
        setMessages(prevMessages => {
          const newMessages = data.filter(
            (newMsg: MessageData) => !prevMessages.some(msg => msg.id === newMsg.id)
          );

          if (newMessages.length > 0) {
            oldestMessageRef.current = newMessages[0].id;
          }

          return [...newMessages, ...prevMessages].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        });

        setHasMore(data.length >= 30);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Не вдалося завантажити старіші повідомлення');
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, authenticatedFetch, hasMore, loadingMore]);

  // Обробник прокрутки
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      userScrolledUpRef.current = scrollTop < scrollHeight - clientHeight - 100;

      // Завантаження старіших повідомлень при досягненні верху
      if (scrollTop === 0 && hasMore && !loadingMore) {
        loadMoreMessages();
      }
    },
    [hasMore, loadingMore, loadMoreMessages]
  );

  // Лише один useEffect для налаштування слухачів подій
  useEffect(() => {
    // Завантажуємо початкові повідомлення тільки один раз
    if (chatId) {
      fetchMessages();
    }

    // Обробник для нових повідомлень
    const handleNewMessage = (message: MessageData) => {
      if (message.chatId === chatId) {
        setMessages(prev => {
          // Перевіряємо, чи повідомлення вже є в списку
          if (prev.some(m => m.id === message.id)) {
            return prev;
          }

          const newMessages = [...prev, message].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          return newMessages;
        });

        // Прокрутка вниз при новому повідомленні, якщо користувач не прокрутив вгору
        if (!userScrolledUpRef.current) {
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }

        // Повідомлення не від поточного користувача
        if (user && message.userId !== user.id && onMarkAsRead) {
          onMarkAsRead();
        }
      }
    };

    // Підписка на події
    const newMessageUnsub = on('new-message', handleNewMessage);

    // Очищення при розмонтуванні
    return () => {
      newMessageUnsub();
      off('new-message');
    };
  }, [chatId, user, fetchMessages, on, off, onMarkAsRead]);

  // Групування повідомлень за датою
  const groupedMessages = useMemo(() => {
    return messages.reduce<Record<string, MessageData[]>>((groups, message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    }, {});
  }, [messages]);

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="p-4 text-destructive">
        <p>{error}</p>
        <Button variant="outline" onClick={fetchMessages} className="mt-2">
          Спробувати знову
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4" onScroll={handleScroll}>
      {hasMore && (
        <div className="py-2 text-center">
          <Button variant="outline" onClick={loadMoreMessages} disabled={loadingMore}>
            {loadingMore ? <Spinner size="sm" className="mr-2" /> : null}
            Завантажити більше
          </Button>
        </div>
      )}

      {Object.entries(groupedMessages).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="flex items-center py-2 my-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="px-3 text-xs text-muted-foreground">{formatDate(new Date(date))}</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="space-y-2">
            {dateMessages.map((message: MessageData) => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.userId === user?.id}
                onReply={() => onReplyToMessage && onReplyToMessage(message)}
              />
            ))}
          </div>
        </div>
      ))}

      {typingMessage && (
        <div className="text-sm text-muted-foreground py-2 px-4 italic">{typingMessage}</div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
