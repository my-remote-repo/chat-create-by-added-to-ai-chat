import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/shared/providers/ThemeProvider';
import { AuthProvider } from '@/domains/auth/presentation/providers/AuthProvider';
import { SocketProvider } from '@/shared/providers/SocketProvider';
import TokenRefreshHandler from '@/shared/components/auth/TokenRefreshHandler';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Next.js DDD Chat',
  description: 'Чат-додаток створений з використанням Next.js та архітектури DDD',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <SocketProvider>
              <TokenRefreshHandler />
              {children}
            </SocketProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
