// src/shared/components/SocketInitializer.tsx
'use client';

import { useEffect, useState } from 'react';

export function SocketInitializer() {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initSocket = async () => {
      try {
        const res = await fetch('/api/socket-init');
        const data = await res.json();
        console.log('Socket initialization response:', data);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    initSocket();
  }, []);

  return null; // Цей компонент не рендерить нічого у DOM
}
