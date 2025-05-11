// src/app/api/auth/refresh-token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';

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

    // Отримуємо авторизаційний сервіс
    const authService = ServiceFactory.createAuthService();

    try {
      // Оновлюємо токени через сервіс
      const result = await authService.refreshTokens(refreshToken);

      if (!result) {
        AuthLogger.warn('Invalid or expired refresh token');
        return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
      }

      const { accessToken, refreshToken: newRefreshToken, userId } = result;

      AuthLogger.info('Token refreshed successfully', { userId });

      // Встановлюємо HTTP-only cookie для refresh token
      const response = NextResponse.json(
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        { status: 200 }
      );

      // Встановлюємо новий refresh токен в HTTP-only cookie
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
      console.error('JWT or token validation error:', error);
      AuthLogger.warn('Invalid refresh token', { refreshToken });
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    AuthLogger.error('Refresh token error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
