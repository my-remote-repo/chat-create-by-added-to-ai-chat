// src/app/(main)/chat/[chatId]/page.tsx
'use client';

import { ChatRoom } from '@/domains/chat/presentation/components/ChatRoom';
import { NewChatForm } from '@/domains/chat/presentation/components/NewChatForm';

export default function ChatPage({ params }: { params: { chatId: string } }) {
  // Якщо це маршрут `new`, відображаємо форму створення нового чату
  if (params.chatId === 'new') {
    return <NewChatForm />;
  }

  // Для всіх інших параметрів, відображаємо звичайну кімнату чату
  return <ChatRoom chatId={params.chatId} />;
}
