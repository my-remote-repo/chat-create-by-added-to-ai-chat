// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from './domains/auth/infrastructure/services/jwtService';
import { AuthLogger } from './domains/auth/infrastructure/services/authLogger';
// Додайте імпорт Redis клієнта
// import { redisClient } from './lib/redis-client';

// Маршрути, що не потребують авторизації
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/reset-password/confirm', // Додайте цей рядок!
  '/api/auth/verify-email',
  '/api/auth/refresh-token',
];

// Шляхи, які починаються з цих префіксів, також публічні
const publicPrefixes = ['/auth/', '/_next/', '/favicon.ico', '/assets/'];

// src/middleware.ts
export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  console.log('Middleware running for path:', pathname);

  // Перевірка чи це публічний маршрут
  if (
    publicRoutes.includes(pathname) ||
    publicPrefixes.some(prefix => pathname.startsWith(prefix))
  ) {
    console.log('Public route, skipping auth check');
    return NextResponse.next();
  }

  // Отримання токена авторизації
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Альтернативно, можливо токен є в cookie (для браузерних запитів)
  const cookieToken = req.cookies.get('accessToken')?.value;
  const accessToken = token || cookieToken;

  // console.log('Middleware auth check:', {
  //   hasAuthHeader: !!authHeader,
  //   hasToken: !!token,
  //   hasCookieToken: !!cookieToken,
  //   hasAccessToken: !!accessToken,
  // });

  if (!accessToken) {
    console.log('No access token found, redirecting to login');
    // Якщо це API запит, повертаємо 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Інакше перенаправляємо на сторінку входу
    const url = new URL('/login', req.url);
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Перевірка токена
    const jwtService = new JwtService();
    console.log('Verifying token in middleware...');
    const payload = await jwtService.verifyAccessToken(accessToken);

    console.log('Token verification result:', {
      isValid: !!payload && !!payload.userId,
      userId: payload?.userId,
    });

    if (!payload || !payload.userId) {
      console.log('Invalid token payload, redirecting to login');
      // Якщо це API запит, повертаємо 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      // Інакше перенаправляємо на сторінку входу
      const url = new URL('/login', req.url);
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Додаємо інформацію про користувача до запиту
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);

    console.log('Auth successful, continuing to route');

    // Продовжуємо обробку запиту
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);

    // Якщо це API запит, повертаємо 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Інакше перенаправляємо на сторінку входу
    const url = new URL('/login', req.url);
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
