// src/domains/user/presentation/components/UsersList.tsx
'use client';

import { UserAvatar } from './Avatar';
import { Button } from '@/shared/components/ui/button';
import { UserResult, useUserSearch } from '../hooks/useUserSearch';
import { useState, useEffect } from 'react';
import { Input } from '@/shared/components/ui/input';
import { Spinner } from '@/shared/components/ui/spinner';
import { formatRelativeTime } from '@/lib/utils';

interface UsersListProps {
  onUserSelect?: (user: UserResult) => void;
  withSearch?: boolean;
  title?: string;
  emptyMessage?: string;
  showOnlineOnly?: boolean;
  limit?: number;
}

export function UsersList({
  onUserSelect,
  withSearch = true,
  title = 'Користувачі',
  emptyMessage = 'Користувачів не знайдено',
  showOnlineOnly = false,
  limit = 20,
}: UsersListProps) {
  const { searchUsers, getOnlineUsers, results, loading, error } = useUserSearch();
  const [searchQuery, setSearchQuery] = useState('');
  const [displayedUsers, setDisplayedUsers] = useState<UserResult[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Початкове завантаження користувачів
  useEffect(() => {
    const loadInitialUsers = async () => {
      try {
        let users: UserResult[] = [];

        if (showOnlineOnly) {
          users = await getOnlineUsers(limit);
        } else if (searchQuery.length >= 2) {
          users = await searchUsers(searchQuery, limit);
        }

        setDisplayedUsers(users);
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsInitialLoading(false);
      }
    };

    loadInitialUsers();
  }, [showOnlineOnly, limit]);

  // Пошук користувачів при зміні запиту
  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        const results = await searchUsers(searchQuery, limit);
        setDisplayedUsers(results);
      } else if (searchQuery.length === 0) {
        // Якщо пошуковий запит порожній, повертаємось до початкового стану
        if (showOnlineOnly) {
          const users = await getOnlineUsers(limit);
          setDisplayedUsers(users);
        } else {
          setDisplayedUsers([]);
        }
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const handleUserClick = (user: UserResult) => {
    if (onUserSelect) {
      onUserSelect(user);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{title}</h2>

      {withSearch && (
        <div className="relative">
          <Input
            placeholder="Пошук користувачів..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      )}

      {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md">{error}</div>}

      {isInitialLoading ? (
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      ) : displayedUsers.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">{emptyMessage}</p>
      ) : (
        <ul className="space-y-2">
          {displayedUsers.map(user => (
            <li key={user.id}>
              <Button
                variant="ghost"
                className="w-full justify-start p-2 h-auto"
                onClick={() => handleUserClick(user)}
              >
                <div className="flex items-center w-full">
                  <UserAvatar
                    src={user.image}
                    name={user.name}
                    status={user.status as any}
                    size="sm"
                  />
                  <div className="ml-3 text-left overflow-hidden">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.status === 'online' ? 'Зараз онлайн' : 'Був в мережі неваідомо коли'}
                    </p>
                  </div>
                </div>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
