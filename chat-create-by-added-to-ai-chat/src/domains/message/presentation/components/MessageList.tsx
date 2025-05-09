// src/domains/message/presentation/components/MessageList.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Spinner } from '@/shared/components/ui/spinner';
import { Button } from '@/shared/components/ui/button';
import { formatDate } from '@/lib/utils';
import { MessageItem } from './MessageItem';
import { useSocketIo } from '@/shared/hooks/useSocketIo';
import { useTypingIndicator } from '@/shared/hooks/useTypingIndicator';

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
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'error' | 'offline';
}

export function MessageList({
  chatId,
  onReplyToMessage,
}: {
  chatId: string;
  onReplyToMessage?: (message: MessageData) => void;
}) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { user, authenticatedFetch } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { on, joinChat, markMessagesAsRead, off } = useSocketIo();
  const { typingMessage } = useTypingIndicator(chatId);
  const oldestMessageRef = useRef<string | null>(null);
  const newestMessageIdRef = useRef<string | null>(null);
  const userScrolledUpRef = useRef(false);
  const shouldScrollToBottomRef = useRef(true);

  // Обробник прокрутки для визначення напрямку
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      userScrolledUpRef.current = scrollTop < scrollHeight - clientHeight - 100;

      // Якщо користувач дійшов до верху, завантажуємо більше повідомлень
      if (scrollTop === 0 && hasMore && !loadingMore) {
        loadMoreMessages();
      }
    },
    [hasMore, loadingMore]
  );

  // Завантаження старіших повідомлень
  const loadMoreMessages = useCallback(async () => {
    if (!hasMore || loadingMore || !oldestMessageRef.current) return;

    try {
      setLoadingMore(true);
      const response = await authenticatedFetch(
        `/api/chat/${chatId}/messages?cursor=${oldestMessageRef.current}`
      );

      if (!response) throw new Error('Failed to load more messages');

      if (response.ok) {
        const data = await response.json();

        if (data.length > 0) {
          setMessages(prevMessages => {
            // Фільтруємо, щоб уникнути дублікатів
            const newMessages = data.filter(
              (newMsg: MessageData) => !prevMessages.some(msg => msg.id === newMsg.id)
            );

            if (newMessages.length > 0) {
              oldestMessageRef.current = newMessages[newMessages.length - 1].id;
            }

            const updatedMessages = [...prevMessages, ...newMessages];
            return updatedMessages.sort(
              (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });

          setHasMore(data.length === 30);
        } else {
          setHasMore(false);
        }
      } else {
        throw new Error('Failed to load more messages');
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
      setError('Не вдалося завантажити більше повідомлень');
    } finally {
      setLoadingMore(false);
    }
  }, [chatId, authenticatedFetch]);

  // Завантаження початкових повідомлень
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/chat/${chatId}/messages`);

        if (!response) throw new Error('Failed to fetch messages');

        if (response.ok) {
          const data = await response.json();

          // Сортуємо за часом створення
          const sortedData = [...data].sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );

          setMessages(sortedData);

          // Зберігаємо ID першого та останнього повідомлення для пагінації
          if (data.length > 0) {
            oldestMessageRef.current = data[data.length - 1].id;
            newestMessageIdRef.current = data[0].id;
          }

          setHasMore(data.length === 30); // Припускаємо, що ліміт за замовчуванням 30
        } else {
          throw new Error('Failed to fetch messages');
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
        setError('Не вдалося завантажити повідомлення');
      } finally {
        setLoading(false);

        // Прокрутка вниз після завантаження
        setTimeout(() => {
          if (shouldScrollToBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
    };

    if (chatId) {
      fetchMessages();
      joinChat(chatId);

      // Позначаємо повідомлення як прочитані
      markMessagesAsRead(chatId);
    }

    return () => {
      // Відписуємось від подій при розмонтуванні
      off('new-message');
      off('message-status-updated');
    };
  }, [chatId, authenticatedFetch, joinChat, markMessagesAsRead, off]);

  // Додавання нового повідомлення у список
  const addNewMessage = useCallback((newMessage: MessageData, isOptimistic = false) => {
    setMessages(prevMessages => {
      // Якщо це оптимістичне повідомлення, просто додаємо його
      if (isOptimistic) {
        newMessage.isOptimistic = true;
        newMessage.status = 'sending';
        newestMessageIdRef.current = newMessage.id;
        return [...prevMessages, newMessage];
      }

      // Якщо це підтверджене повідомлення з сервера
      const optimisticIndex = prevMessages.findIndex(
        msg => msg.isOptimistic && msg.id === newMessage.id
      );

      if (optimisticIndex !== -1) {
        // Замінюємо оптимістичну версію підтвердженою
        const updatedMessages = [...prevMessages];
        updatedMessages[optimisticIndex] = {
          ...newMessage,
          isOptimistic: false,
          status: 'sent',
        };
        return updatedMessages;
      } else {
        // Перевіряємо на дублікати за реальним ID
        const existingIndex = prevMessages.findIndex(msg => msg.id === newMessage.id);
        if (existingIndex !== -1) {
          return prevMessages;
        }

        // Це нове повідомлення з сервера
        newestMessageIdRef.current = newMessage.id;
        const updatedMessages = [...prevMessages, newMessage];
        return updatedMessages.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
    });

    // Прокрутка вниз при отриманні нового повідомлення, якщо користувач не прокрутив вгору
    if (!userScrolledUpRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, []);

  // Прослуховування нових повідомлень
  useEffect(() => {
    const handleNewMessage = (message: MessageData) => {
      if (message.chatId === chatId) {
        // Додаємо нове повідомлення
        addNewMessage(message);

        // Якщо повідомлення від інших користувачів, позначаємо його як прочитане
        if (message.userId !== user?.id) {
          markMessagesAsRead(chatId);
        }
      }
    };

    // Підписка на події нових повідомлень
    const unsubscribe = on('new-message', handleNewMessage);

    // Підписка на оновлення статусу повідомлень
    const statusUnsubscribe = on(
      'message-status-updated',
      (data: { messageId: string; status: string }) => {
        setMessages(prevMessages => {
          const updatedMessages = [...prevMessages];
          const messageIndex = updatedMessages.findIndex(msg => msg.id === data.messageId);

          if (messageIndex !== -1) {
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              status: data.status as 'sending' | 'sent' | 'error' | 'offline',
              isOptimistic: data.status === 'sending',
            };
          }

          return updatedMessages;
        });
      }
    );

    return () => {
      unsubscribe();
      statusUnsubscribe();
    };
  }, [chatId, user?.id, addNewMessage, on, markMessagesAsRead]);

  // Функція для обробки відповіді на повідомлення
  const handleReply = useCallback(
    (message: MessageData) => {
      if (onReplyToMessage) {
        onReplyToMessage(message);
      }
    },
    [onReplyToMessage]
  );

  // Групування повідомлень за датою
  const groupedMessages = messages.reduce(
    (groups, message) => {
      const date = new Date(message.createdAt).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    },
    {} as Record<string, MessageData[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-destructive">
        <p>{error}</p>
        <Button variant="outline" onClick={() => setLoading(true)} className="mt-2">
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
            {dateMessages.map(message => (
              <MessageItem
                key={message.id}
                message={message}
                isOwnMessage={message.userId === user?.id}
                onReply={handleReply}
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
