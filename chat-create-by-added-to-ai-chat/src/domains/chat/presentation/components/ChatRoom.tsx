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
        setChat(data);
        setError(null);

        // Запитуємо статуси відразу після отримання даних чату
        if (!data.isGroup && data.otherUser && data.otherUser.id) {
          console.log(`Requesting status for other user: ${data.otherUser.id}`);
          requestUserStatus(data.otherUser.id);
        } else if (data.isGroup && data.participants && data.participants.length > 0) {
          const participantIds = data.participants
            .filter((p: ChatParticipant) => p.userId !== user?.id) // Виключаємо поточного користувача
            .map((p: ChatParticipant) => p.userId);
          requestUsersStatus(participantIds);
        }
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
  }, [chatId, authenticatedFetch, requestUserStatus, requestUsersStatus, user]);

  // Використання socket для надсилання повідомлень
  const sendMessage = (content: string) => {
    if (sendChatMessage) {
      sendChatMessage({
        chatId,
        content,
      });
    } else {
      emit('send-message', {
        chatId,
        content,
      });
    }
  };

  // Ефект для приєднання до кімнати чату
  useEffect(() => {
    if (chatId) {
      console.log(`Joining chat room: chat:${chatId}`);
      joinChat(chatId);
      markAsRead(chatId);
    }

    return () => {
      console.log(`Leaving chat: ${chatId}`);
    };
  }, [chatId, joinChat, markAsRead]);

  // Ефект для приєднання через сокети при з'єднанні
  useEffect(() => {
    if (isConnected && chatId) {
      console.log(`Emission join-chat event for chat:${chatId}`);
      emit('join-chat', chatId);
    }
  }, [chatId, isConnected, emit]);

  // Ефект для запиту статусів користувачів кожні 30 секунд
  useEffect(() => {
    if (!isConnected || !chat) return;

    const requestStatus = () => {
      if (!chat.isGroup && chat.otherUser?.id) {
        console.log(`Requesting status for other user: ${chat.otherUser.id}`);
        requestUserStatus(chat.otherUser.id);
      } else if (chat.isGroup && chat.participants) {
        const participantIds = chat.participants
          .filter((p: ChatParticipant) => p.userId !== user?.id)
          .map((p: ChatParticipant) => p.userId);

        if (participantIds.length > 0) {
          console.log(`Requesting status for ${participantIds.length} participants`);
          requestUsersStatus(participantIds);
        }
      }
    };

    // Початковий запит статусу
    requestStatus();

    // Налаштування інтервалу для періодичного оновлення статусів
    const intervalId = setInterval(requestStatus, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, chat, requestUserStatus, requestUsersStatus, user]);

  // Підписка на події нових повідомлень
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message: any) {
      console.log('New message received:', message);
      // Логіка обробки нових повідомлень (за потреби)
    }

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.off('new-message', handleNewMessage);
    };
  }, [socket]);

  // Спрощений обробник прочитання повідомлень
  const handleMarkAsRead = useCallback(() => {
    if (isConnected && chatId) {
      emit('read-message', { chatId });
    }
  }, [chatId, emit, isConnected]);

  // Підключення до чату при монтуванні компонента
  useEffect(() => {
    if (chatId) {
      fetchChat();
    }

    return () => {
      fetchInProgress.current = false;
    };
  }, [chatId, fetchChat]);

  const handleGoBack = () => {
    router.push('/chat');
  };

  const handleReply = (message: MessageData) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  // Отримання статусу для іншого користувача
  const getOtherUserStatus = useCallback(() => {
    if (!chat || chat.isGroup) return undefined;

    if (chat.otherUser?.id) {
      // Спочатку перевіряємо статус зі стану userStatuses
      const statusInfo = getUserStatus(chat.otherUser.id);
      console.log(
        `Status for ${chat.otherUser.id}:`,
        statusInfo ? statusInfo.status : 'from chat:',
        chat.otherUser.status
      );

      // Повертаємо статус з хуку, якщо він доступний, в іншому випадку - зі стану чату
      return statusInfo?.status || chat.otherUser.status || 'offline';
    }

    return 'offline';
  }, [chat, getUserStatus]);

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

  // Отримуємо поточний статус іншого користувача
  const otherUserStatus = getOtherUserStatus();

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
