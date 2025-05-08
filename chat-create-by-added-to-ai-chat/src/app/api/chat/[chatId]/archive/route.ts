// src/app/api/chat/[chatId]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';

interface RouteParams {
  params: {
    chatId: string;
  };
}

// PUT /api/chat/:chatId/archive - архівація/відновлення чату
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;
    const data = await req.json();
    const archive = data.archive === true; // конвертуємо в boolean

    // Отримання сервісу чатів
    const chatService = ServiceFactory.createChatService();

    // Перевіряємо, чи користувач є учасником чату
    const chat = await chatService.getChatById(chatId, authResult.userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Архівація/відновлення чату
    const success = await chatService.toggleArchive(chatId, authResult.userId, archive);

    if (!success) {
      return NextResponse.json({ error: 'Failed to update chat archive status' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: archive ? 'Chat archived successfully' : 'Chat unarchived successfully',
    });
  } catch (error) {
    console.error('Error toggling chat archive status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
