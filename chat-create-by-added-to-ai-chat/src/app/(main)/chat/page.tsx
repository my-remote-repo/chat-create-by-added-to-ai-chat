// src/app/(main)/chat/page.tsx
'use client';

import { ChatList } from '@/domains/chat/presentation/components/ChatList';

export default function ChatIndexPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-56px)] md:h-screen">
      <div className="text-center max-w-md p-4">
        <h1 className="text-2xl font-bold mb-4">Ласкаво просимо до чату</h1>
        <p className="text-muted-foreground mb-6">
          Вітаємо у нашому чат-додатку, побудованому на Next.js з архітектурою DDD. Ви можете
          створювати чати, надсилати повідомлення та спілкуватися з іншими користувачами.
        </p>
        <p className="text-sm text-muted-foreground">
          Оберіть чат зліва або створіть новий, щоб почати спілкування.
        </p>
      </div>
    </div>
  );
}
