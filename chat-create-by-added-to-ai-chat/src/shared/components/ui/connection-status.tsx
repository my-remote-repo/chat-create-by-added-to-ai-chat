// src/shared/components/ui/connection-status.tsx
'use client';

import { useSocket } from '@/shared/providers/SocketProvider';
import { Button } from './button';
import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const { isConnected, connect, error } = useSocket();
  const [showReconnect, setShowReconnect] = useState(false);

  // Показуємо кнопку повторного підключення тільки після певної затримки без з'єднання
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (!isConnected) {
      timeout = setTimeout(() => {
        setShowReconnect(true);
      }, 5000); // Показуємо кнопку через 5 секунд відсутності з'єднання
    } else {
      setShowReconnect(false);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [isConnected]);

  if (isConnected) {
    return null; // Нічого не показуємо, якщо з'єднання встановлено
  }

  return (
    <div className="p-2 bg-amber-100 text-amber-700 flex items-center justify-between">
      <div className="flex items-center">
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
          className="text-amber-500 mr-2"
        >
          <line x1="1" y1="1" x2="23" y2="23"></line>
          <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
          <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
          <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
          <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
          <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        <span className="text-sm">Офлайн режим{error ? `: ${error}` : ''}</span>
      </div>
      {showReconnect && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => connect()}
          className="text-xs text-amber-700 hover:text-amber-900"
        >
          Підключитися
        </Button>
      )}
    </div>
  );
}
