// src/domains/chat/presentation/components/NewChatForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { useUserSearch } from '@/domains/user/presentation/hooks/useUserSearch';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { Spinner } from '@/shared/components/ui/spinner';

export function NewChatForm() {
  const router = useRouter();
  const { authenticatedFetch, user } = useAuth();
  const { searchUsers, results, loading } = useUserSearch();

  const [searchQuery, setSearchQuery] = useState('');
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<
    { id: string; name: string; image?: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      searchUsers(query);
    }
  };

  const handleSelectUser = (selectedUser: { id: string; name: string; image?: string }) => {
    // Перевіряємо, щоб не додати одного користувача двічі
    if (!selectedUsers.some(user => user.id === selectedUser.id)) {
      setSelectedUsers(prev => [...prev, selectedUser]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId));
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsSubmitting(true);

      // Валідація
      if (selectedUsers.length === 0) {
        setError('Виберіть хоча б одного користувача');
        return;
      }

      if (isGroup && !groupName) {
        setError("Ім'я групи обов'язкове");
        return;
      }

      // Формуємо дані для запиту
      const chatData = {
        type: isGroup ? 'group' : 'personal',
        participants: selectedUsers.map(user => user.id),
        name: isGroup ? groupName : undefined,
        description: isGroup ? groupDescription : undefined,
      };

      // Відправка запиту на створення чату
      const response = await authenticatedFetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chatData),
      });

      if (!response) throw new Error('Failed to create chat');

      if (response.ok) {
        const data = await response.json();
        router.push(`/chat/${data.id}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка створення чату');
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      setError(err instanceof Error ? err.message : 'Не вдалося створити чат');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Створити новий чат</h2>

      {error && (
        <div className="p-3 mb-4 bg-destructive/10 text-destructive rounded-md">{error}</div>
      )}

      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="isGroup" className="text-sm font-medium">
              Груповий чат
            </label>
            <Switch id="isGroup" checked={isGroup} onCheckedChange={setIsGroup} />
          </div>
        </div>

        {isGroup && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="groupName" className="text-sm font-medium">
                Назва групи
              </label>
              <Input
                id="groupName"
                value={groupName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGroupName(e.target.value)}
                placeholder="Введіть назву групи"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="groupDescription" className="text-sm font-medium">
                Опис (опціонально)
              </label>
              <Textarea
                id="groupDescription"
                value={groupDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setGroupDescription(e.target.value)
                }
                placeholder="Введіть опис групи"
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="searchUser" className="text-sm font-medium">
              {isGroup ? 'Додати учасників' : 'Вибрати користувача'}
            </label>
            <Input
              id="searchUser"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSearch(e.target.value)}
              placeholder="Пошук користувачів..."
            />
          </div>

          {searchQuery.length >= 2 && (
            <div className="border rounded-md overflow-hidden max-h-60 overflow-y-auto">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Spinner />
                </div>
              ) : results.length === 0 ? (
                <p className="p-4 text-center text-muted-foreground">Користувачів не знайдено</p>
              ) : (
                results
                  .filter(u => u.id !== user?.id && !selectedUsers.some(su => su.id === u.id))
                  .map(userResult => (
                    <div
                      key={userResult.id}
                      className="p-2 hover:bg-accent cursor-pointer flex items-center"
                      onClick={() => handleSelectUser(userResult)}
                    >
                      <UserAvatar
                        src={userResult.image}
                        name={userResult.name}
                        status={userResult.status as any}
                        size="sm"
                      />
                      <div className="ml-2">
                        <p className="font-medium">{userResult.name}</p>
                        <p className="text-xs text-muted-foreground">{userResult.email}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {isGroup ? 'Учасники' : 'Вибраний користувач'}
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map(selectedUser => (
                  <div
                    key={selectedUser.id}
                    className="bg-accent rounded-full pl-1 pr-2 py-1 flex items-center"
                  >
                    <UserAvatar src={selectedUser.image} name={selectedUser.name} size="xs" />
                    <span className="mx-2 text-sm">{selectedUser.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveUser(selectedUser.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
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
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedUsers.length === 0 || (isGroup && !groupName)}
          >
            {isSubmitting && <Spinner className="mr-2" size="sm" />}
            Створити чат
          </Button>
        </div>
      </div>
    </div>
  );
}
