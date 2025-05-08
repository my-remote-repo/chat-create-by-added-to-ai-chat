// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

// Схема валідації для створення чату
const createChatSchema = z.object({
  type: z.enum(['personal', 'group']),
  name: z.string().optional(),
  description: z.string().optional(),
  participants: z.array(z.string()).min(1, 'Потрібен хоча б один учасник'),
});

// GET /api/chat - отримання списку чатів
export async function GET(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Отримання параметрів запиту
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const onlyGroups = searchParams.get('onlyGroups') === 'true';
    const onlyPersonal = searchParams.get('onlyPersonal') === 'true';
    const search = searchParams.get('search') || '';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Отримання сервісу чатів
    const chatService = ServiceFactory.createChatService();

    // Отримання списку чатів
    const chats = await chatService.getUserChats(authResult.userId, {
      cursor,
      limit,
      onlyGroups,
      onlyPersonal,
      search,
      includeArchived,
    });

    return NextResponse.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat - створення нового чату
export async function POST(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Перевіряємо, чи є userId
    if (!authResult.userId) {
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
    }

    // Отримання даних з запиту
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = createChatSchema.parse(data);

      // Отримання сервісу чатів
      const chatService = ServiceFactory.createChatService();

      let chat;
      if (validatedData.type === 'personal') {
        // Перевіряємо, що є тільки один учасник (окрім поточного користувача)
        if (validatedData.participants.length !== 1) {
          return NextResponse.json(
            { error: 'Для особистого чату потрібен тільки один учасник' },
            { status: 400 }
          );
        }

        // Створення особистого чату
        chat = await chatService.createOrGetPersonalChat(
          authResult.userId,
          validatedData.participants[0]
        );
      } else {
        // Створення групового чату
        if (!validatedData.name) {
          return NextResponse.json(
            { error: "Для групового чату потрібно вказати ім'я" },
            { status: 400 }
          );
        }

        // Додаємо поточного користувача до списку учасників, якщо його там немає
        const participants = [...validatedData.participants];
        if (!participants.includes(authResult.userId)) {
          participants.push(authResult.userId);
        }

        // Створення групового чату
        chat = await chatService.createGroupChat(
          validatedData.name,
          authResult.userId, // поточний користувач стає власником
          participants,
          validatedData.description || undefined // Використовуємо undefined якщо опис не вказано
        );
      }

      return NextResponse.json(chat, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return NextResponse.json({ error: 'Validation error', details: errors }, { status: 400 });
      }

      throw validationError;
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
