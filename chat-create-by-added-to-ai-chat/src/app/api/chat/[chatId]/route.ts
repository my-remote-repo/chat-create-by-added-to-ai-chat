// src/app/api/chat/[chatId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';

interface RouteParams {
  params: {
    chatId: string;
  };
}

// GET /api/chat/:chatId - отримання інформації про чат
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;

    // Отримання сервісу чатів
    const chatService = ServiceFactory.createChatService();

    // Отримання інформації про чат
    const chat = await chatService.getChatById(chatId, authResult.userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chat/:chatId - видалення чату (тільки для власника)
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;

    // Отримання сервісу чатів
    const chatService = ServiceFactory.createChatService();

    // Спочатку перевіряємо, чи є користувач власником чату
    const chat = await chatService.getChatById(chatId, authResult.userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (chat.ownerId !== authResult.userId) {
      return NextResponse.json({ error: 'Only the owner can delete the chat' }, { status: 403 });
    }

    // Видалення чату
    await chatService.deleteChat(chatId);

    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/chat/:chatId - оновлення чату (назва, опис)
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;
    const data = await req.json();

    // Перевірка наявності полів для оновлення
    if (!data.name && !data.description) {
      return NextResponse.json(
        { error: 'At least one field (name or description) must be provided' },
        { status: 400 }
      );
    }

    // Отримання сервісу чатів
    const chatService = ServiceFactory.createChatService();

    // Оновлення даних чату
    const updatedChat = await chatService.updateChatDetails(chatId, authResult.userId, {
      name: data.name,
      description: data.description,
    });

    if (!updatedChat) {
      return NextResponse.json({ error: 'Failed to update chat' }, { status: 400 });
    }

    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
