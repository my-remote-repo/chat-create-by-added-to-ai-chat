// src/domains/user/presentation/components/UserStatusSelector.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { useUser } from '../hooks/useUser';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Spinner } from '@/shared/components/ui/spinner';

export function UserStatusSelector() {
  const { profile, updateStatus } = useUser();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status: string) => {
    setIsUpdating(true);

    try {
      await updateStatus(status as 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY');
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!profile) {
    return <div className="h-10 w-32 animate-pulse bg-muted rounded" />;
  }

  const currentStatus = profile.status || 'OFFLINE';

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Статус:</span>

      {isUpdating ? (
        <div className="h-10 px-3 flex items-center">
          <Spinner size="sm" />
        </div>
      ) : (
        <Select value={currentStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Виберіть статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ONLINE">
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                Онлайн
              </div>
            </SelectItem>
            <SelectItem value="BUSY">
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-red-500 mr-2"></span>
                Зайнятий
              </div>
            </SelectItem>
            <SelectItem value="AWAY">
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-yellow-500 mr-2"></span>
                Відійшов
              </div>
            </SelectItem>
            <SelectItem value="OFFLINE">
              <div className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-gray-400 mr-2"></span>
                Невидимий
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
