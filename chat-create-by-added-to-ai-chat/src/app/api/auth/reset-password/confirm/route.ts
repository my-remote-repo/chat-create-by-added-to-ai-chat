// src/app/api/auth/reset-password/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { z } from 'zod';

// Схема валідації для підтвердження скидання пароля
const resetPasswordConfirmSchema = z
  .object({
    token: z.string().min(1, "Токен є обов'язковим"),
    password: z
      .string()
      .min(8, 'Пароль повинен містити не менше 8 символів')
      .regex(/[A-Z]/, 'Пароль повинен містити хоча б одну велику літеру')
      .regex(/[a-z]/, 'Пароль повинен містити хоча б одну малу літеру')
      .regex(/[0-9]/, 'Пароль повинен містити хоча б одну цифру'),
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

export async function POST(req: NextRequest) {
  try {
    // Отримання даних з запиту
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = resetPasswordConfirmSchema.parse(data);

      // Тепер ми можемо безпечно витягти значення
      const { token, password } = validatedData;

      // Отримуємо сервіс автентифікації
      const authService = ServiceFactory.createAuthService();

      // Завершуємо скидання пароля
      const result = await authService.completePasswordReset(token, password);

      if (!result) {
        AuthLogger.warn('Password reset failed', { token });
        return NextResponse.json({ error: 'Невірний або прострочений токен' }, { status: 400 });
      }

      AuthLogger.info('Password reset completed successfully', { token });

      return NextResponse.json(
        { message: 'Ваш пароль був успішно скинутий. Тепер ви можете увійти з новим паролем.' },
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
    console.error('Reset password confirm error:', error);
    AuthLogger.error('Reset password confirm error', { error });
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
