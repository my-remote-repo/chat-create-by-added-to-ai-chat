// src/domains/user/presentation/components/AvatarUploader.tsx
'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { UserAvatar } from './Avatar';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/lib/utils';
import { useUser } from '../hooks/useUser';
import { Spinner } from '@/shared/components/ui/spinner';

interface AvatarUploaderProps {
  className?: string;
}

export function AvatarUploader({ className }: AvatarUploaderProps) {
  const { profile, updateAvatar } = useUser();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Перевірка типу файлу
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setError('Підтримуються тільки формати JPEG, PNG, WebP та GIF');
      return;
    }

    // Перевірка розміру файлу (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Розмір файлу не повинен перевищувати 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await updateAvatar(file);
      if (!result) {
        throw new Error('Помилка завантаження аватара');
      }
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Не вдалося завантажити аватар');
    } finally {
      setIsUploading(false);
      // Очищаємо input для можливості повторного завантаження того ж файла
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (!profile) {
    return <div className="animate-pulse h-16 w-16 rounded-full bg-muted" />;
  }

  return (
    <div className={cn('flex flex-col items-center space-y-4', className)}>
      <UserAvatar
        src={profile.image}
        name={profile.name}
        size="xl"
        status={profile.status as any}
      />

      <div className="flex flex-col items-center">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleButtonClick}
          disabled={isUploading}
        >
          {isUploading ? <Spinner className="mr-2" size="sm" /> : null}
          Змінити аватар
        </Button>

        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </div>
    </div>
  );
}
