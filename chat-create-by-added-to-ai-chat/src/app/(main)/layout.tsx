// src/app/(main)/layout.tsx
'use client';

import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { UserAvatar } from '@/domains/user/presentation/components/Avatar';
import { Button } from '@/shared/components/ui/button';
import { useUser } from '@/domains/user/presentation/hooks/useUser';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { useTheme } from 'next-themes';
import { Spinner } from '@/shared/components/ui/spinner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { profile } = useUser();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { theme, setTheme } = useTheme();
  const [hasAccessToken, setHasAccessToken] = useState(false);

  // Перевірка localStorage в useEffect (тільки на клієнті)
  useEffect(() => {
    console.log('MainLayout - Auth state:', {
      user,
      isAuthenticated: !!user,
      hasAccessToken: !!localStorage.getItem('accessToken'),
    });

    setHasAccessToken(!!localStorage.getItem('accessToken'));
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="flex h-screen">
      {/* Мобільна навігація */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-background z-50 border-b p-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={toggleSidebar}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </Button>
          <h1 className="text-xl font-bold">Next.js DDD Chat</h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-0">
                <UserAvatar
                  src={profile?.image}
                  name={user.name}
                  status={profile?.status as any}
                  size="sm"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/profile">Профіль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Налаштування</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? <Spinner className="mr-2" size="sm" /> : null}
                Вийти
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Бічна панель */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-card border-r transform transition-transform md:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold">Next.js DDD Chat</h1>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            <Button
              variant={isActive('/chat') ? 'default' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
              <Link href="/chat">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                Чати
              </Link>
            </Button>

            <Button
              variant={isActive('/profile') ? 'default' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
              <Link href="/profile">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Профіль
              </Link>
            </Button>

            <Button
              variant={isActive('/settings') ? 'default' : 'ghost'}
              className="w-full justify-start"
              asChild
            >
              <Link href="/settings">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
                Налаштування
              </Link>
            </Button>
          </nav>

          <div className="p-4 border-t hidden md:block">
            <div className="flex items-center">
              <UserAvatar
                src={profile?.image}
                name={user.name}
                status={profile?.status as any}
                size="sm"
              />
              <div className="ml-3 overflow-hidden">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-center"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <Spinner className="mr-2" size="sm" /> : null}
                Вийти
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Основний контент */}
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {/* Затемнення для мобільної версії при відкритому меню */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-background/80 z-30 md:hidden" onClick={toggleSidebar} />
        )}

        {children}
      </main>
    </div>
  );
}
