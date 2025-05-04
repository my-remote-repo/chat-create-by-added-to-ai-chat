// src/app/api/auth/refresh-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';

export async function POST(req: NextRequest) {
  try {
    // Отримання refresh токена з кукі або з тіла запиту
    const refreshToken = req.cookies.get('refresh-token')?.value || (await req.json()).refreshToken;

    if (!refreshToken) {
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 401 });
    }

    // Отримуємо JWT сервіс
    const jwtService = new JwtService();

    // Верифікуємо refresh токен
    const payload = await jwtService.verifyRefreshToken(refreshToken);

    if (!payload || !payload.userId) {
      AuthLogger.warn('Invalid refresh token', { refreshToken });
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Отримуємо сервіс автентифікації
    const authService = ServiceFactory.createAuthService();

    // Перевіряємо чи токен не відкликаний
    const isValid = await authService.validateRefreshToken(payload.userId, refreshToken);

    if (!isValid) {
      AuthLogger.warn('Refresh token revoked', { userId: payload.userId, refreshToken });
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // Генеруємо нові токени
    const { accessToken, refreshToken: newRefreshToken } = await jwtService.generateTokens(
      payload.userId,
      payload.email as string,
      payload.role as string
    );

    // Оновлюємо запис про токен
    await authService.updateRefreshToken(payload.userId, refreshToken, newRefreshToken);

    AuthLogger.info('Token refreshed successfully', { userId: payload.userId });

    // Встановлюємо новий refresh токен в кукі
    const response = NextResponse.json({ accessToken }, { status: 200 });

    response.cookies.set({
      name: 'refresh-token',
      value: newRefreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 днів
    });

    return response;
  } catch (error) {
    console.error('Refresh token error:', error);
    AuthLogger.error('Refresh token error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
