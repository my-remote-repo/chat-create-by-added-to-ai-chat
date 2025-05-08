// src/app/api/chat/[chatId]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';

interface RouteParams {
  params: {
    chatId: string;
  };
}

// POST /api/chat/:chatId/read - позначення всіх повідомлень як прочитаних
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;

    // Отримання сервісу повідомлень
    const messageService = ServiceFactory.createMessageService();

    // Позначення всіх повідомлень у чаті як прочитаних
    const success = await messageService.markAllAsRead(chatId, authResult.userId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'All messages marked as read',
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
