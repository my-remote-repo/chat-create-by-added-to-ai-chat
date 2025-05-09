'use client';

import { ChatList } from '@/domains/chat/presentation/components/ChatList';
import { Button } from '@/shared/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChatIndexPage() {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);

  const handleSelectChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleCreateChat = () => {
    router.push('/chat/new');
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-56px)] md:h-screen">
      {/* Панель зі списком чатів */}
      <div className="w-full md:w-80 border-r h-full flex flex-col">
        <div className="p-3 border-b flex justify-between items-center">
          <h2 className="font-semibold">Ваші чати</h2>
          <Button size="sm" onClick={handleCreateChat}>
            Новий
          </Button>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatList onSelectChat={handleSelectChat} />
        </div>
      </div>

      {/* Вітальний екран (відображається лише коли чат не вибраний) */}
      <div className="hidden md:flex flex-1 flex-col items-center justify-center p-4">
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
    </div>
  );
}
