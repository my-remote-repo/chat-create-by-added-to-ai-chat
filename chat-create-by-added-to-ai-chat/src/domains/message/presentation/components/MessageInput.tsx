// src/domains/message/presentation/components/MessageInput.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { Button } from '@/shared/components/ui/button';
import { useSocketIo } from '@/shared/hooks/useSocketIo';
import { useTypingIndicator } from '@/shared/hooks/useTypingIndicator';
import { Spinner } from '@/shared/components/ui/spinner';
import { MessageData } from './MessageList';

interface MessageInputProps {
  chatId: string;
  replyToMessage?: MessageData | null;
  onCancelReply?: () => void;
}

export function MessageInput({ chatId, replyToMessage, onCancelReply }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authenticatedFetch } = useAuth();
  const { sendMessage, sendTypingStatus } = useSocketIo();
  const { setTyping } = useTypingIndicator(chatId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Автоматичний ресайз текстової області
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prevFiles => [...prevFiles, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setMessage(newText);

    // Відправляємо статус "друкує"
    if (newText.length > 0) {
      setTyping(true);
    } else {
      setTyping(false);
    }
  };

  const uploadFiles = async (): Promise<Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }> | null> => {
    if (files.length === 0) return [];

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'message');

        const response = await authenticatedFetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response || !response.ok) {
          throw new Error(`Failed to upload file: ${file.name}`);
        }

        const data = await response.json();
        uploadedFiles.push({
          name: data.name,
          url: data.url,
          size: data.size,
          type: data.type,
        });
      }

      return uploadedFiles;
    } catch (err) {
      console.error('Error uploading files:', err);
      setError('Помилка завантаження файлів');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    if ((!message.trim() && files.length === 0) || sendingMessage || uploading) return;

    setError(null);
    setSendingMessage(true);

    try {
      // Завантажуємо файли, якщо вони є
      const uploadedFiles = files.length > 0 ? await uploadFiles() : [];

      if (files.length > 0 && !uploadedFiles) {
        throw new Error('Failed to upload files');
      }

      // Відправляємо повідомлення через Socket.io
      const result = sendMessage({
        chatId,
        content: message.trim(),
        replyToId: replyToMessage?.id,
        files: uploadedFiles || undefined,
      });

      if (!result) {
        throw new Error('Failed to send message');
      }

      // Очищаємо форму
      setMessage('');
      setFiles([]);
      if (onCancelReply) onCancelReply();

      // Скидаємо статус "друкує"
      setTyping(false);
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Не вдалося відправити повідомлення');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-3 border-t bg-card">
      {error && (
        <div className="mb-2 p-2 text-sm bg-destructive/10 text-destructive rounded">{error}</div>
      )}

      {replyToMessage && (
        <div className="mb-2 p-2 border-l-4 border-primary bg-muted rounded-sm flex justify-between items-center">
          <div>
            <p className="text-xs font-medium">
              Відповідь для {replyToMessage.user?.name || 'Користувач'}
            </p>
            <p className="text-sm truncate">{replyToMessage.content}</p>
          </div>
          {onCancelReply && (
            <Button variant="ghost" size="sm" onClick={onCancelReply} className="h-6 w-6 p-0">
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
            </Button>
          )}
        </div>
      )}

      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="p-2 bg-muted rounded-md flex items-center">
              <span className="text-xs truncate max-w-[100px]">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(index)}
                className="h-5 w-5 p-0 ml-1"
              >
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
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={openFileSelector}
          disabled={uploading || sendingMessage}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
        </Button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Введіть повідомлення..."
            className="w-full p-3 pr-10 resize-none min-h-[40px] max-h-[200px] rounded-md border border-input focus:outline-none focus:ring-2 focus:ring-ring"
            rows={1}
            disabled={sendingMessage || uploading}
          />
        </div>

        <Button
          type="button"
          onClick={handleSend}
          disabled={(!message.trim() && files.length === 0) || sendingMessage || uploading}
          size="icon"
        >
          {sendingMessage || uploading ? (
            <Spinner size="sm" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </Button>
      </div>
    </div>
  );
}
