// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';

export async function POST(req: NextRequest) {
  try {
    // Отримання токена авторизації
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Отримання refresh токена з кукі
    const refreshToken = req.cookies.get('refresh-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Отримуємо JWT сервіс
    const jwtService = new JwtService();

    // Верифікуємо access токен
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Отримуємо сервіс автентифікації
    const authService = ServiceFactory.createAuthService();

    // Виходимо з системи, передаючи також access токен для чорного списку
    await authService.logout(payload.userId, refreshToken, token);

    AuthLogger.info('User logged out', { userId: payload.userId });

    // Очищаємо кукі
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });

    response.cookies.delete('refresh-token');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    AuthLogger.error('Logout error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
