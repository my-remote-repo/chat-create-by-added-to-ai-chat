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
import { Spinner } from '@/shared/components/ui/spinner';

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
                fill="currentColor"
                viewBox="0 0 16 16"
                className="mr-2"
              >
                <path d="M4.5 9.5A.5.5 0 0 1 5 9h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5z" />
                <path d="M9.5 5a.5.5 0 0 0-1 0v5a.5.5 0 0 0 1 0V5z" />
                <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4.5a1 1 0 0 1 .293-.707l5-5A1 1 0 0 1 7.5 0h5a1 1 0 0 1 1 1v3.5a1 1 0 0 1-1 1H10a1 1 0 0 1-1-1V1H7v3.5a1 1 0 0 1-1 1H3v8.5A1.5 1.5 0 0 0 4.5 15h7A1.5 1.5 0 0 0 13 13.5V4.5a.5.5 0 0 0-.5-.5H10V1.707L13.293 5H14z" />
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

  // Відображення статусу відправлення повідомлення
  const renderMessageStatus = () => {
    if (!isOwnMessage) return null;

    if (message.isOptimistic) {
      if (message.status === 'sending') {
        return <Spinner size="sm" className="ml-2" />;
      } else if (message.status === 'error') {
        return (
          <span className="ml-2 text-xs text-destructive flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Помилка
          </span>
        );
      }
    }

    // Для успішно відправлених повідомлень
    return (
      <span className="ml-2 text-xs text-muted-foreground">
        {message.readBy && message.readBy.length > 1 ? 'Прочитано' : 'Надіслано'}
      </span>
    );
  };

  // Додаємо прозорість для оптимістичних повідомлень
  const messageOpacity = message.isOptimistic ? 'opacity-80' : 'opacity-100';

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
                  ? `bg-primary text-primary-foreground ml-auto rounded-br-none ${messageOpacity}`
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

              {renderMessageStatus()}

              {!isEditing && !message.isOptimistic && (
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
