import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';

export async function PUT(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Отримання даних з formData
    const formData = await req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Перевірка типу файлу
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Перевірка розміру файлу (5MB максимум)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File is too large (max 5MB)' }, { status: 400 });
    }

    // Конвертація File в Buffer для обробки
    const buffer = Buffer.from(await file.arrayBuffer());

    // Оновлення аватара користувача
    const userService = ServiceFactory.createUserService();
    const updatedUser = await userService.updateUserAvatar(authResult.userId, buffer, file.type);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update avatar' }, { status: 400 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user avatar:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
