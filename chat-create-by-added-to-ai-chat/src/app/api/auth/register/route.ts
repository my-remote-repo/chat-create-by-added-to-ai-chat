// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { z } from 'zod';

// Схема валідації для реєстрації
const registrationSchema = z
  .object({
    name: z.string().min(2, "Ім'я повинно містити не менше 2 символів"),
    email: z.string().email('Невірний формат email'),
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
      const validatedData = registrationSchema.parse(data);

      // Тепер ми можемо безпечно витягти значення
      const { name, email, password } = validatedData;

      // Отримуємо сервіс автентифікації
      const authService = ServiceFactory.createAuthService();

      // Створюємо користувача
      const result = await authService.register(name, email, password);

      if (!result) {
        AuthLogger.warn('Registration failed', { email });
        return NextResponse.json({ error: 'Користувач з таким email вже існує' }, { status: 409 });
      }

      // Відправка листа для підтвердження пошти
      await authService.sendVerificationEmail(result.id, email, name);

      AuthLogger.info('User registered successfully', { userId: result.id, email });

      // Відповідь з успішною реєстрацією
      return NextResponse.json(
        {
          message:
            'Реєстрація успішна. Будь ласка, перевірте вашу пошту для підтвердження облікового запису.',
          user: { id: result.id, name: result.name, email: result.email },
        },
        { status: 201 }
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
    console.error('Registration error:', error);
    AuthLogger.error('Registration error', { error });
    return NextResponse.json({ error: 'Внутрішня помилка сервера' }, { status: 500 });
  }
}
