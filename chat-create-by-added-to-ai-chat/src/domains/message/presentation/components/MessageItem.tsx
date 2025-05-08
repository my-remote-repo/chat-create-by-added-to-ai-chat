// src/domains/message/presentation/components/MessageItem.tsx
'use client';

import { useState } from 'react';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { Button } from '@/shared/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';
import { MessageData } from './MessageList';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/shared/components/ui/dropdown-menu';

interface MessageItemProps {
  message: MessageData;
  isOwnMessage: boolean;
  onReply: (message: MessageData) => void;
}

export function MessageItem({ message, isOwnMessage, onReply }: MessageItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(message.content);
  };

  const handleSaveEdit = async () => {
    // Логіка збереження змін буде реалізована пізніше
    setIsEditing(false);
  };

  const handleDelete = async () => {
    // Логіка видалення буде реалізована пізніше
  };

  // Форматуємо час повідомлення
  const messageTime = formatRelativeTime(new Date(message.createdAt));

  // Визначаємо компонент файлів, якщо вони є
  const renderFiles = () => {
    if (!message.files || message.files.length === 0) return null;

    return (
      <div className="mt-2 space-y-2">
        {message.files.map(file => {
          const isImage = file.type.startsWith('image/');

          if (isImage) {
            return (
              <div key={file.id} className="rounded-md overflow-hidden">
                <img src={file.url} alt={file.name} className="max-w-xs max-h-60 object-contain" />
              </div>
            );
          }

          return (
            <a
              key={file.id}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center p-2 bg-accent rounded-md hover:bg-accent/80"
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
                className="mr-2"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              <span className="text-sm truncate">{file.name}</span>
            </a>
          );
        })}
      </div>
    );
  };

  // Відповідь на повідомлення, якщо є
  const renderReplyTo = () => {
    if (!message.replyTo) return null;

    return (
      <div className="mb-1 pl-2 border-l-2 border-muted-foreground/30 text-sm text-muted-foreground">
        <span className="font-medium">{message.replyTo.user?.name || 'Користувач'}: </span>
        <span>{message.replyTo.content}</span>
      </div>
    );
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] ${isOwnMessage ? 'order-1' : 'order-2'}`}>
        <div className="flex items-start gap-2">
          {!isOwnMessage && (
            <UserAvatar
              src={message.user?.image}
              name={message.user?.name || 'Користувач'}
              size="sm"
            />
          )}

          <div>
            {!isOwnMessage && (
              <div className="text-sm font-medium mb-1">{message.user?.name || 'Користувач'}</div>
            )}

            <div
              className={`p-3 rounded-lg ${
                isOwnMessage
                  ? 'bg-primary text-primary-foreground ml-auto rounded-br-none'
                  : 'bg-secondary rounded-bl-none'
              }`}
            >
              {renderReplyTo()}

              {isEditing ? (
                <div>
                  <textarea
                    value={editedContent}
                    onChange={e => setEditedContent(e.target.value)}
                    className="w-full p-2 mb-2 rounded-md bg-background text-foreground"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                      Скасувати
                    </Button>
                    <Button size="sm" onClick={handleSaveEdit}>
                      Зберегти
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div>{message.content}</div>
                  {renderFiles()}
                </>
              )}
            </div>

            <div className="flex items-center mt-1">
              <span className="text-xs text-muted-foreground">{messageTime}</span>

              {message.readBy && message.readBy.length > 0 && isOwnMessage && (
                <span className="ml-2 text-xs text-muted-foreground">Прочитано</span>
              )}

              {!isEditing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
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
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="19" cy="12" r="1" />
                        <circle cx="5" cy="12" r="1" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onReply(message)}>Відповісти</DropdownMenuItem>
                    {isOwnMessage && (
                      <>
                        <DropdownMenuItem onClick={handleEdit}>Редагувати</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={handleDelete}>
                          Видалити
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
