// src/app/(main)/settings/page.tsx
'use client';

import { UserSettings } from '@/domains/user/presentation/components/UserSettings';
import { Button } from '@/shared/components/ui/button';
import { Spinner } from '@/shared/components/ui/spinner';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { useState } from 'react';

export default function SettingsPage() {
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-3xl font-bold mb-8">Налаштування</h1>

      <div className="space-y-8">
        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <UserSettings />
        </div>

        <div className="bg-card p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-semibold mb-4">Обліковий запис</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Зміна пароля</h3>
              <p className="text-sm text-muted-foreground">
                Для зміни пароля скористайтесь функцією відновлення пароля з екрану входу.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-destructive">Вихід з системи</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Вийти з облікового запису на всіх пристроях.
              </p>

              <Button variant="destructive" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <Spinner className="mr-2" /> : null}
                Вийти з системи
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
