// src/domains/user/presentation/components/Avatar.tsx
import { cn, getInitials, stringToColor } from '@/lib/utils';
import Image from 'next/image';
import React from 'react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

export function UserAvatar({ src, name, size = 'md', status, className }: AvatarProps) {
  const initials = getInitials(name);
  const color = stringToColor(name);

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
  };

  const statusSizeClasses = {
    xs: 'h-1.5 w-1.5',
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  return (
    <div className={cn('relative inline-flex rounded-full', className)}>
      {src ? (
        <Image
          src={src}
          alt={name}
          width={
            size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : size === 'sm' ? 32 : 24
          }
          height={
            size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : size === 'sm' ? 32 : 24
          }
          className={cn('rounded-full object-cover', sizeClasses[size])}
        />
      ) : (
        <div
          className={cn('flex items-center justify-center rounded-full', sizeClasses[size])}
          style={{ backgroundColor: color }}
        >
          <span className="font-medium text-white">{initials}</span>
        </div>
      )}

      {status && (
        <span
          className={cn(
            'absolute right-0 bottom-0 rounded-full border-2 border-background',
            statusColors[status],
            statusSizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
