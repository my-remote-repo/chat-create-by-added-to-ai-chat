'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Якщо користувач авторизований, перенаправляємо на головну сторінку чату
    if (!loading && isAuthenticated) {
      router.push('/chat');
    }
  }, [isAuthenticated, loading, router]);

  // Показуємо індикатор завантаження, поки перевіряється автентифікація
  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-center text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Next.js DDD Chat</h1>
        <p className="text-lg md:text-xl mb-8 text-muted-foreground max-w-2xl">
          Сучасний чат-додаток з підтримкою особистих та групових чатів, медіа-файлів та
          вбудовування на інші сайти
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          {!isAuthenticated && (
            <>
              <Button asChild size="lg">
                <Link href="/login">Увійти</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/register">Зареєструватись</Link>
              </Button>
            </>
          )}

          {isAuthenticated && (
            <Button asChild size="lg">
              <Link href="/chat">Перейти до чату</Link>
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
