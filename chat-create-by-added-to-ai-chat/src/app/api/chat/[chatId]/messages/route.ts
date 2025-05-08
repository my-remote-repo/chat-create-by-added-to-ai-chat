// src/app/api/chat/[chatId]/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

interface RouteParams {
  params: {
    chatId: string;
  };
}

// Схема валідації для створення повідомлення
const createMessageSchema = z.object({
  content: z.string().min(1, 'Повідомлення не може бути порожнім'),
  replyToId: z.string().optional(),
  files: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        size: z.number(),
        type: z.string(),
      })
    )
    .optional(),
});

// GET /api/chat/:chatId/messages - отримання повідомлень чату
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;

    // Отримання параметрів запиту
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const before = searchParams.get('before')
      ? new Date(searchParams.get('before') as string)
      : undefined;
    const after = searchParams.get('after')
      ? new Date(searchParams.get('after') as string)
      : undefined;
    const search = searchParams.get('search') || undefined;

    // Отримання сервісу повідомлень
    const messageService = ServiceFactory.createMessageService();

    // Перевірка, чи користувач має доступ до чату
    const chatService = ServiceFactory.createChatService();
    const chat = await chatService.getChatById(chatId, authResult.userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found or access denied' }, { status: 404 });
    }

    // Отримання повідомлень
    const messages = await messageService.getChatMessages(chatId, authResult.userId, {
      limit,
      cursor,
      before,
      after,
      search,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/:chatId/messages - створення нового повідомлення
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { chatId } = params;
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = createMessageSchema.parse(data);

      // Отримання сервісу повідомлень
      const messageService = ServiceFactory.createMessageService();

      // Створення повідомлення
      const message = await messageService.createMessage(
        chatId,
        authResult.userId,
        validatedData.content,
        validatedData.replyToId,
        validatedData.files
      );

      if (!message) {
        return NextResponse.json({ error: 'Failed to create message' }, { status: 400 });
      }

      return NextResponse.json(message, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation error', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
