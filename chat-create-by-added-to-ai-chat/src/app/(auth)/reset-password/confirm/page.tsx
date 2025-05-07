// src/app/(auth)/reset-password/confirm/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import ResetPasswordConfirmForm from '@/domains/auth/presentation/components/ResetPasswordConfirmForm';
import { useEffect, useState } from 'react';

export default function ResetPasswordConfirmPage() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    setToken(tokenParam);
  }, [searchParams]);

  if (!token) {
    return (
      <div className="container flex items-center justify-center min-h-screen py-12">
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          Невірний токен для скидання пароля
        </div>
      </div>
    );
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <ResetPasswordConfirmForm token={token} />
    </div>
  );
}
