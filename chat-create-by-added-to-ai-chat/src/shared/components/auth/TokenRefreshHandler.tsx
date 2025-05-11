// src/shared/components/auth/TokenRefreshHandler.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export default function TokenRefreshHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { authenticatedFetch } = useAuth();

  useEffect(() => {
    // Перевіряємо, чи є параметр refresh=true
    if (searchParams.get('refresh') === 'true') {
      console.log('Token refresh requested via URL parameter');

      // Виконуємо тестовий запит, який оновить токен якщо потрібно
      authenticatedFetch('/api/auth/me')
        .then(() => {
          console.log('Token refresh completed');

          // Видаляємо параметр з URL без перезавантаження сторінки
          const url = new URL(window.location.href);
          url.searchParams.delete('refresh');

          // Використовуємо replace щоб не створювати новий запис в історії браузера
          router.replace(url.pathname + url.search);
        })
        .catch(err => {
          console.error('Error during token refresh:', err);
        });
    }
  }, [searchParams, authenticatedFetch, router]);

  return null; // Цей компонент не рендерить нічого видимого
}
