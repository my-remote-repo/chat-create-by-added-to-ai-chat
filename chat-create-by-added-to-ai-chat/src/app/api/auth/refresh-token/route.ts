// src/app/api/auth/refresh-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';

export async function POST(req: NextRequest) {
  try {
    console.log('Refresh token API called');
    let refreshToken;

    // Спочатку спробуємо отримати токен з тіла запиту
    try {
      const body = await req.json();
      refreshToken = body.refreshToken;
      console.log('RefreshToken from body:', refreshToken ? 'present' : 'missing');
    } catch (error) {
      console.error('Error parsing request body:', error);
    }

    // Якщо токен не знайдено в тілі, перевіряємо cookies
    if (!refreshToken) {
      refreshToken =
        req.cookies.get('refreshToken')?.value || req.cookies.get('refresh-token')?.value;
      console.log('RefreshToken from cookies:', refreshToken ? 'present' : 'missing');
    }

    if (!refreshToken) {
      console.error('Refresh token is missing');
      return NextResponse.json({ error: 'Refresh token is required' }, { status: 401 });
    }

    // Отримуємо JWT сервіс
    const jwtService = new JwtService();

    try {
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
      const response = NextResponse.json(
        {
          accessToken,
          refreshToken: newRefreshToken, // Додаємо refresh токен у відповідь
        },
        { status: 200 }
      );

      response.cookies.set({
        name: 'refreshToken',
        value: newRefreshToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        maxAge: 30 * 24 * 60 * 60, // 30 днів
      });

      return response;
    } catch (error) {
      console.error('JWT Verification error:', error);
      AuthLogger.warn('Invalid refresh token', { refreshToken });
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    AuthLogger.error('Refresh token error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
