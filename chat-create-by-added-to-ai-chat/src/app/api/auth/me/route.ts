// src/app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';

export async function GET(req: NextRequest) {
  try {
    // Отримання токена авторизації
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Отримуємо JWT сервіс
    const jwtService = new JwtService();

    // Верифікуємо токен
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Отримуємо сервіс користувачів
    const userService = ServiceFactory.createUserService();

    // Отримуємо профіль користувача
    const user = await userService.getUserProfile(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    AuthLogger.info('User authenticated', { userId: payload.userId });

    // Повертаємо дані користувача
    return NextResponse.json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    AuthLogger.error('Auth error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
