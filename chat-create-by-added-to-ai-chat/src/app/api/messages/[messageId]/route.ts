// src/app/api/messages/[messageId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

interface RouteParams {
  params: {
    messageId: string;
  };
}

// Схема валідації для оновлення повідомлення
const updateMessageSchema = z.object({
  content: z.string().min(1, 'Повідомлення не може бути порожнім'),
});

// GET /api/messages/:messageId - отримання конкретного повідомлення
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { messageId } = params;

    // Отримання сервісу повідомлень
    const messageService = ServiceFactory.createMessageService();

    // Отримання повідомлення
    const message = await messageService.getMessageById(messageId, authResult.userId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/messages/:messageId - оновлення повідомлення
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { messageId } = params;
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = updateMessageSchema.parse(data);

      // Отримання сервісу повідомлень
      const messageService = ServiceFactory.createMessageService();

      // Отримання повідомлення для перевірки власника
      const message = await messageService.getMessageById(messageId, authResult.userId);

      if (!message) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
      }

      // Перевірка, чи користувач є автором повідомлення
      if (message.userId !== authResult.userId) {
        return NextResponse.json({ error: 'You can only edit your own messages' }, { status: 403 });
      }

      // Редагування повідомлення
      const updatedMessage = await messageService.editMessage(
        messageId,
        authResult.userId,
        validatedData.content
      );

      if (!updatedMessage) {
        return NextResponse.json({ error: 'Failed to update message' }, { status: 400 });
      }

      return NextResponse.json(updatedMessage);
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
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/messages/:messageId - видалення повідомлення
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { messageId } = params;

    // Отримання сервісу повідомлень
    const messageService = ServiceFactory.createMessageService();

    // Отримання повідомлення для перевірки прав
    const message = await messageService.getMessageById(messageId, authResult.userId);

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Видалення повідомлення
    const success = await messageService.deleteMessage(messageId, authResult.userId);

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete message' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
