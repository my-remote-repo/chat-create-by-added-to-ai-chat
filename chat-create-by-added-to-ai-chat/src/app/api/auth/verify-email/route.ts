// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';

export async function GET(req: NextRequest) {
  try {
    // Отримання токена з URL-параметра
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Отримуємо сервіс автентифікації
    const authService = ServiceFactory.createAuthService();

    // Верифікуємо email
    const result = await authService.verifyEmail(token);

    if (!result) {
      AuthLogger.warn('Email verification failed', { token });
      return NextResponse.redirect(new URL('/auth/verify-failed', req.url));
    }

    AuthLogger.info('Email verified successfully', { token });

    // Перенаправляємо на сторінку успішної верифікації
    return NextResponse.redirect(new URL('/auth/verify-success', req.url));
  } catch (error) {
    console.error('Email verification error:', error);
    AuthLogger.error('Email verification error', { error });
    return NextResponse.redirect(new URL('/auth/verify-failed', req.url));
  }
}
