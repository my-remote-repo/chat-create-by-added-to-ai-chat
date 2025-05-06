import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

// Схема валідації для оновлення статусу
const updateStatusSchema = z.object({
  status: z.enum(['ONLINE', 'OFFLINE', 'AWAY', 'BUSY']),
});

// Оновлення свого статусу
export async function PUT(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Отримання даних з запиту
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = updateStatusSchema.parse(data);

      // Оновлення статусу
      const userService = ServiceFactory.createUserService();
      const success = await userService.updateUserStatus(authResult.userId, validatedData.status);

      if (!success) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 400 });
      }

      return NextResponse.json({ status: validatedData.status });
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
    console.error('Error updating user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
