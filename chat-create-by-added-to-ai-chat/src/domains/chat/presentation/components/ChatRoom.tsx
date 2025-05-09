// src/domains/chat/presentation/components/ChatRoom.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { MessageList, MessageData } from '@/domains/message/presentation/components/MessageList';
import { MessageInput } from '@/domains/message/presentation/components/MessageInput';
import { useSocketIo } from '@/shared/hooks/useSocketIo';

interface ChatRoomProps {
  chatId: string;
}

interface ChatDetails {
  id: string;
  name: string;
  description?: string;
  isGroup: boolean;
  ownerId?: string;
  otherUser?: {
    id: string;
    name: string;
    image?: string;
    status?: string;
  };
  participants: Array<{
    userId: string;
    isAdmin: boolean;
    user?: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
}

export function ChatRoom({ chatId }: ChatRoomProps) {
  const [chat, setChat] = useState<ChatDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<MessageData | null>(null);
  const { authenticatedFetch } = useAuth();
  const router = useRouter();
  const { isConnected } = useSocketIo();

  useEffect(() => {
    const fetchChatDetails = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`/api/chat/${chatId}`);

        if (!response) throw new Error('Failed to fetch chat details');

        if (response.ok) {
          const data = await response.json();
          setChat(data);
        } else {
          throw new Error('Failed to fetch chat details');
        }
      } catch (err) {
        console.error('Error fetching chat details:', err);
        setError('Не вдалося завантажити деталі чату');
      } finally {
        setLoading(false);
      }
    };

    if (chatId) {
      fetchChatDetails();
    }
  }, [chatId, authenticatedFetch]);

  const handleGoBack = () => {
    router.push('/chat');
  };

  const handleReply = (message: MessageData) => {
    setReplyTo(message);
  };

  const handleCancelReply = () => {
    setReplyTo(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="p-4 text-destructive">
        <p>{error || 'Чат не знайдено'}</p>
        <Button variant="outline" onClick={handleGoBack} className="mt-2">
          Повернутися до списку чатів
        </Button>
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
        <MessageList chatId={chatId} key={chatId} onReplyToMessage={handleReply} />
      </div>

      <MessageInput chatId={chatId} replyToMessage={replyTo} onCancelReply={handleCancelReply} />
    </div>
  );
}
