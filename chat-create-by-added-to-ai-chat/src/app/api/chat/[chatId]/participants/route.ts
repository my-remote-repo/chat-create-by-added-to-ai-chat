// src/app/api/chat/[chatId]/participants/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

interface RouteParams {
  params: {
    chatId: string;
  };
}

// Схема валідації для додавання учасників
const addParticipantSchema = z.object({
  userId: z.string(),
});

// Схема валідації для видалення учасників
const removeParticipantSchema = z.object({
  userId: z.string(),
});

// GET /api/chat/:chatId/participants - отримання списку учасників
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

    // Отримання чату
    const chat = await chatService.getChatById(chatId, authResult.userId);

    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Повертаємо список учасників
    return NextResponse.json(chat.participants);
  } catch (error) {
    console.error('Error fetching chat participants:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat/:chatId/participants - додавання учасника
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
      const validatedData = addParticipantSchema.parse(data);

      // Отримання сервісу чатів
      const chatService = ServiceFactory.createChatService();

      // Додавання учасника
      const success = await chatService.addParticipant(
        chatId,
        validatedData.userId,
        authResult.userId
      );

      if (!success) {
        return NextResponse.json({ error: 'Failed to add participant' }, { status: 400 });
      }

      // Отримання оновленого чату
      const updatedChat = await chatService.getChatById(chatId, authResult.userId);

      return NextResponse.json({
        success: true,
        message: 'Participant added successfully',
        participants: updatedChat?.participants || [],
      });
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
    console.error('Error adding participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/chat/:chatId/participants - видалення учасника
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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
      const validatedData = removeParticipantSchema.parse(data);

      // Отримання сервісу чатів
      const chatService = ServiceFactory.createChatService();

      // Видалення учасника
      const success = await chatService.removeParticipant(
        chatId,
        validatedData.userId,
        authResult.userId
      );

      if (!success) {
        return NextResponse.json({ error: 'Failed to remove participant' }, { status: 400 });
      }

      // Отримання оновленого чату
      const updatedChat = await chatService.getChatById(chatId, authResult.userId);

      return NextResponse.json({
        success: true,
        message: 'Participant removed successfully',
        participants: updatedChat?.participants || [],
      });
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
    console.error('Error removing participant:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
