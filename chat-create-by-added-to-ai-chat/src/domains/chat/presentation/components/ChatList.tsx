// src/domains/chat/presentation/components/ChatList.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Spinner } from '@/shared/components/ui/spinner';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { formatRelativeTime } from '@/lib/utils';

interface ChatListProps {
  selectedChatId?: string;
  onSelectChat?: (chatId: string) => void;
}

interface ChatItem {
  id: string;
  name: string;
  lastMessage?: {
    content: string;
    createdAt: Date;
    senderId: string;
  };
  isGroup: boolean;
  unreadCount: number;
  otherUser?: {
    id: string;
    name: string;
    image?: string | null;
    status?: string;
  };
}

export function ChatList({ selectedChatId, onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch('/api/chat');

        if (!response) throw new Error('Failed to fetch chats');

        if (response.ok) {
          const data = await response.json();
          setChats(data);
        } else {
          throw new Error('Failed to fetch chats');
        }
      } catch (err) {
        console.error('Error fetching chats:', err);
        setError('Не вдалося завантажити чати');
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [authenticatedFetch]);

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    return chat.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleChatClick = (chatId: string) => {
    if (onSelectChat) {
      onSelectChat(chatId);
    } else {
      router.push(`/chat/${chatId}`);
    }
  };

  const handleCreateChat = () => {
    router.push('/chat/new');
  };

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
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Input
          placeholder="Пошук чатів..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="p-3 border-b">
        <Button onClick={handleCreateChat} className="w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <line x1="12" y1="7" x2="12" y2="13" />
            <line x1="9" y1="10" x2="15" y2="10" />
          </svg>
          Створити чат
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto chat-list">
        {filteredChats.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            {searchQuery ? 'Чатів не знайдено' : 'У вас ще немає чатів'}
          </div>
        ) : (
          filteredChats.map(chat => (
            <div
              key={chat.id}
              className={`p-3 cursor-pointer hover:bg-accent transition-colors ${
                selectedChatId === chat.id ? 'bg-accent' : ''
              }`}
              onClick={() => handleChatClick(chat.id)}
            >
              <div className="flex items-center">
                <UserAvatar
                  src={chat.isGroup ? undefined : chat.otherUser?.image}
                  name={chat.name}
                  status={chat.isGroup ? undefined : (chat.otherUser?.status as any)}
                />

                <div className="ml-3 flex-1 overflow-hidden">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium truncate">{chat.name}</h3>
                    {chat.lastMessage && (
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(new Date(chat.lastMessage.createdAt))}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage ? chat.lastMessage.content : 'Немає повідомлень'}
                    </p>

                    {chat.unreadCount > 0 && (
                      <div className="bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                        {chat.unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
