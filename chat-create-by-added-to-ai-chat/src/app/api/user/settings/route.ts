import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

// Схема валідації для налаштувань
const userSettingsSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
  notificationsEnabled: z.boolean().optional(),
  soundsEnabled: z.boolean().optional(),
  desktopNotifications: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
  showReadReceipts: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
});

// Отримання налаштувань
export async function GET(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Отримання налаштувань користувача
    const userService = ServiceFactory.createUserService();
    const settings = await userService.getUserSettings(authResult.userId);

    if (!settings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Оновлення налаштувань
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
      const validatedData = userSettingsSchema.parse(data);

      // Оновлення налаштувань
      const userService = ServiceFactory.createUserService();
      const updatedSettings = await userService.updateUserSettings(
        authResult.userId,
        validatedData
      );

      if (!updatedSettings) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 400 });
      }

      return NextResponse.json(updatedSettings);
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
    console.error('Error updating user settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
