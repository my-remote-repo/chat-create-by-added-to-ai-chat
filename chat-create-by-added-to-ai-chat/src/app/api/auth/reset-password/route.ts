// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { z } from 'zod';

// Обмеження на кількість запитів скидання паролю не реалізовуємо поки що

// Схема валідації для запиту скидання пароля
const resetPasswordRequestSchema = z.object({
  email: z.string().email('Невірний формат email'),
});

export async function POST(req: NextRequest) {
  try {
    // Отримання даних з запиту
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = resetPasswordRequestSchema.parse(data);

      // Тепер ми можемо безпечно витягти значення
      const { email } = validatedData;

      // Отримуємо сервіс автентифікації
      const authService = ServiceFactory.createAuthService();

      // Ініціюємо скидання пароля
      const result = await authService.initiatePasswordReset(email);

      // Завжди повертаємо успішний результат, навіть якщо email не знайдено
      // Це запобігає витоку інформації про існування акаунтів
      AuthLogger.info('Password reset initiated', { email, success: result });

      return NextResponse.json(
        {
          message: 'Якщо email існує в нашій системі, ви отримаєте інструкції для скидання пароля.',
        },
        { status: 200 }
      );
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errors = validationError.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        return NextResponse.json({ error: 'Помилка валідації', details: errors }, { status: 400 });
      }

      throw validationError;
    }
  } catch (error) {
    console.error('Reset password error:', error);
    AuthLogger.error('Reset password error', { error });
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
