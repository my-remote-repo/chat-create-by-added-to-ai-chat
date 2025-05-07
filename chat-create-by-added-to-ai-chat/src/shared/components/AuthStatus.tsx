// src/shared/components/AuthStatus.tsx
'use client';

import { useEffect, useState } from 'react';

export function useAuthStatus() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // localStorage доступний тільки у браузері, тому перевіряємо у useEffect
    setHasToken(!!localStorage.getItem('accessToken'));
  }, []);

  return hasToken;
}
