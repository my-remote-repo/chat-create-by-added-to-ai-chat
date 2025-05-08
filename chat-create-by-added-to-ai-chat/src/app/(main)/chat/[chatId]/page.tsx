// src/app/(main)/chat/[chatId]/page.tsx
'use client';

import { ChatRoom } from '@/domains/chat/presentation/components/ChatRoom';

export default function ChatPage({ params }: { params: { chatId: string } }) {
  return <ChatRoom chatId={params.chatId} />;
}
