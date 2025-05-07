// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { z } from 'zod';

// Схема валідації для входу
const loginSchema = z.object({
  email: z.string().email('Невірний формат email'),
  password: z.string().min(1, "Пароль обов'язковий"),
});

export async function POST(req: NextRequest) {
  try {
    // Отримання даних з запиту
    const data = await req.json();

    // Валідація даних
    try {
      const validatedData = loginSchema.parse(data);

      // Отримуємо сервіс автентифікації
      const authService = ServiceFactory.createAuthService();

      // Спроба входу
      const result = await authService.login(validatedData.email, validatedData.password);

      if (!result) {
        AuthLogger.warn('Login failed', { email: validatedData.email });
        return NextResponse.json({ error: 'Невірний email або пароль' }, { status: 401 });
      }

      AuthLogger.info('User logged in successfully', {
        userId: result.user.id,
        email: result.user.email,
      });

      // Встановлюємо refresh токен у HttpOnly cookie
      const response = NextResponse.json({
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          // Не відправляємо refreshToken у відповіді, якщо встановлюємо як HttpOnly cookie
        },
      });

      // AccessToken у звичайній cookie (доступний для JavaScript)
      response.cookies.set({
        name: 'accessToken',
        value: result.tokens.accessToken,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 15 * 60, // 15 хвилин
      });

      // RefreshToken у HttpOnly cookie (недоступний для JavaScript)
      response.cookies.set({
        name: 'refreshToken',
        value: result.tokens.refreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 днів
      });

      return response;
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
    console.error('Login error:', error);
    AuthLogger.error('Login error', { error });
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
