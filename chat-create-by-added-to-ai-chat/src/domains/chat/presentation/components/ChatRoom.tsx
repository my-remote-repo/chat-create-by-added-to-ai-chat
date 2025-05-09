// src/domains/chat/presentation/components/ChatRoom.tsx
'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { MessageList, MessageData } from '@/domains/message/presentation/components/MessageList';
import { MessageInput } from '@/domains/message/presentation/components/MessageInput';
import { useSocket } from '@/shared/providers/SocketProvider';
import { useSocketIo } from '@/shared/hooks/useSocketIo';
import { useUserStatus } from '@/shared/hooks/useUserStatus';

interface ChatParticipant {
  userId: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

interface Chat {
  id: string;
  name: string;
  isGroup: boolean;
  participants: ChatParticipant[];
  otherUser?: {
    id: string;
    name: string;
    image?: string;
    status?: string;
  };
}

export function ChatRoom({ chatId }: { chatId: string }) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageData | null>(null);
  const { authenticatedFetch, user } = useAuth();
  const router = useRouter();
  const { isConnected, socket, emit } = useSocket();
  const fetchInProgress = useRef(false);
  const statusRequestedRef = useRef(false);
  const { joinChat, markAsRead, sendChatMessage } = useSocketIo();
  const { userStatuses, getUserStatus, requestUserStatus, requestUsersStatus } = useUserStatus();

  // Функція для одноразового отримання даних чату
  const fetchChat = useCallback(async () => {
    // Запобігання повторним запитам
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;

    try {
      setLoading(true);
      const response = await authenticatedFetch(`/api/chat/${chatId}`);

      if (!response) {
        throw new Error('Failed to fetch chat details');
      }

      if (response.ok) {
        const data = await response.json();
        console.log('Chat data received:', data);

        // Якщо потрібно, обробіть дані перед збереженням
        if (
          !data.isGroup &&
          !data.otherUser &&
          data.participants &&
          data.participants.length === 2 &&
          user
        ) {
          // Виправлена типізація параметра p
          const otherParticipant = data.participants.find(
            (p: ChatParticipant) => p.userId !== user.id
          );
          if (otherParticipant) {
            console.log('Adding missing otherUser from participants');
            data.otherUser = {
              id: otherParticipant.userId,
              name: otherParticipant.user?.name || 'Користувач',
              image: otherParticipant.user?.image,
            };
          }
        }

        setChat(data);
        setError(null);
      } else {
        throw new Error('Failed to fetch chat details');
      }
    } catch (err) {
      console.error('Error fetching chat details:', err);
      setError('Не вдалося завантажити деталі чату');
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  }, [chatId, authenticatedFetch, user]);

  // Компонент монтується або змінюється chatId
  useEffect(() => {
    console.log(`[ChatRoom] Component mounted or chatId changed: ${chatId}`);
    statusRequestedRef.current = false; // Скидаємо прапорець
    fetchChat();

    return () => {
      fetchInProgress.current = false;
      console.log(`[ChatRoom] Component unmounted or chatId changed from: ${chatId}`);
    };
  }, [chatId, fetchChat]);

  // Приєднання до кімнати чату через socket.io
  useEffect(() => {
    if (chatId) {
      console.log(`[ChatRoom] Joining chat room: chat:${chatId}`);
      joinChat(chatId);
      markAsRead(chatId);
    }

    return () => {
      console.log(`[ChatRoom] Leaving chat: ${chatId}`);
    };
  }, [chatId, joinChat, markAsRead]);

  // Надсилання join-chat події при з'єднанні
  useEffect(() => {
    if (isConnected && chatId) {
      console.log(`[ChatRoom] Sending join-chat event for chat:${chatId}`);
      emit('join-chat', chatId);
    }
  }, [chatId, isConnected, emit]);

  // Єдиний ефект для запиту статусів після завантаження даних чату
  useEffect(() => {
    // Виконуємо тільки якщо чат завантажено і це не було зроблено раніше
    if (chat && !statusRequestedRef.current) {
      console.log('[ChatRoom] Chat data available, requesting statuses');

      if (!chat.isGroup && chat.otherUser?.id) {
        console.log(`[ChatRoom] Requesting status for other user: ${chat.otherUser.id}`);
        requestUserStatus(chat.otherUser.id);
      } else if (chat.isGroup && chat.participants) {
        const participantIds = chat.participants
          .filter(p => p.userId !== user?.id)
          .map(p => p.userId);

        if (participantIds.length > 0) {
          console.log(`[ChatRoom] Requesting status for ${participantIds.length} participants`);
          requestUsersStatus(participantIds);
        }
      }

      statusRequestedRef.current = true; // Позначаємо, що запит був зроблений
    }
  }, [chat, user, requestUserStatus, requestUsersStatus]);

  // Періодичне оновлення статусів (лише якщо чат завантажено)
  useEffect(() => {
    if (!isConnected || !chat) return;

    // Функція оновлення статусів
    const updateStatuses = () => {
      if (!chat.isGroup && chat.otherUser?.id) {
        console.log(`[ChatRoom] Periodic status update for: ${chat.otherUser.id}`);
        requestUserStatus(chat.otherUser.id);
      } else if (chat.isGroup && chat.participants) {
        const participantIds = chat.participants
          .filter(p => p.userId !== user?.id)
          .map(p => p.userId);

        if (participantIds.length > 0) {
          console.log(
            `[ChatRoom] Periodic status update for ${participantIds.length} participants`
          );
          requestUsersStatus(participantIds);
        }
      }
    };

    // Запускаємо оновлення статусів кожні 30 секунд
    const intervalId = setInterval(updateStatuses, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, chat, requestUserStatus, requestUsersStatus, user]);

  // Обробник нових повідомлень
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: any) {
      console.log('[ChatRoom] New message received:', message);
      // Логіка обробки нових повідомлень (за потреби)
    }

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  // Обробник прочитання повідомлень
  const handleMarkAsRead = useCallback(() => {
    if (isConnected && chatId) {
      emit('read-message', { chatId });
    }
  }, [chatId, emit, isConnected]);

  const handleGoBack = () => {
    router.push('/chat');
  };

  const handleReply = (message: MessageData) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // Обчислюємо статус іншого користувача один раз при кожному оновленні залежностей
  const otherUserStatus = useMemo(() => {
    if (!chat || chat.isGroup) {
      return undefined;
    }

    // Визначаємо ID іншого користувача
    let otherUserId: string | undefined;

    if (chat.otherUser?.id) {
      otherUserId = chat.otherUser.id;
    } else if (user && chat.participants) {
      // Виправлена типізація
      const otherParticipant = chat.participants.find((p: ChatParticipant) => p.userId !== user.id);
      otherUserId = otherParticipant?.userId;
    }

    // Отримуємо статус за ID
    if (otherUserId) {
      const status = getUserStatus(otherUserId);
      return status?.status || 'offline';
    }

    return 'offline';
  }, [chat, user, getUserStatus]);

  // Рендеринг при завантаженні
  if (loading && !chat) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  // Рендеринг при помилці
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

  // Рендеринг під час завантаження даних
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

  // Основний рендеринг компонента
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
          status={chat.isGroup ? undefined : (otherUserStatus as any)}
        />

        <div className="ml-3 flex-1 overflow-hidden">
          <div className="flex items-center">
            <h3 className="font-medium truncate">{chat.name}</h3>
            {!isConnected && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full">
                Офлайн режим
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {chat.isGroup
              ? `${chat.participants.length} учасників`
              : otherUserStatus === 'online'
                ? 'В мережі'
                : 'Не в мережі'}
          </p>
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
