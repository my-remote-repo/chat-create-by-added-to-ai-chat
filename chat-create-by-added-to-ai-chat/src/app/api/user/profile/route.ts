import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { z } from 'zod';

// Схема валідації для оновлення профілю
const updateProfileSchema = z.object({
  name: z.string().min(2, "Ім'я повинно містити не менше 2 символів"),
  bio: z.string().max(500, 'Біографія не повинна перевищувати 500 символів').optional(),
});

// Отримання профілю
export async function GET(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Отримання профілю користувача
    const userService = ServiceFactory.createUserService();
    const profile = await userService.getUserProfile(authResult.userId);

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Оновлення профілю
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
      const validatedData = updateProfileSchema.parse(data);

      // Оновлення профілю
      const userService = ServiceFactory.createUserService();
      const updatedProfile = await userService.updateUserProfile(
        authResult.userId,
        validatedData.name,
        validatedData.bio
      );

      if (!updatedProfile) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 });
      }

      return NextResponse.json(updatedProfile);
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
    console.error('Error updating user profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
