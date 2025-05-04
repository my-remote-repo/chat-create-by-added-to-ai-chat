// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from './domains/auth/infrastructure/services/jwtService';
import { AuthLogger } from './domains/auth/infrastructure/services/authLogger';

// Маршрути, що не потребують авторизації
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/reset-password',
  '/api/auth/verify-email',
  '/api/auth/refresh-token',
];

// Шляхи, які починаються з цих префіксів, також публічні
const publicPrefixes = ['/auth/', '/_next/', '/favicon.ico', '/api/auth/', '/embed/', '/assets/'];

// Маршрути, що потребують адміністративних прав
const adminRoutes = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Реєстрація запиту в логах
  const clientIP = req.headers.get('x-forwarded-for') || req.ip || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Перевірка чи це публічний маршрут
  if (
    publicRoutes.includes(pathname) ||
    publicPrefixes.some(prefix => pathname.startsWith(prefix))
  ) {
    return NextResponse.next();
  }

  // Отримання токена авторизації
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  // Альтернативно, можливо токен є в cookie (для браузерних запитів)
  const cookieToken = req.cookies.get('accessToken')?.value;
  const accessToken = token || cookieToken;

  if (!accessToken) {
    AuthLogger.warn('Unauthorized access attempt', {
      pathname,
      clientIP,
      userAgent,
      reason: 'No token provided',
    });

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
    const payload = await jwtService.verifyAccessToken(accessToken);

    if (!payload || !payload.userId) {
      AuthLogger.warn('Unauthorized access attempt', {
        pathname,
        clientIP,
        userAgent,
        reason: 'Invalid token',
      });

      // Якщо це API запит, повертаємо 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }

      // Інакше перенаправляємо на сторінку входу
      const url = new URL('/login', req.url);
      url.searchParams.set('returnUrl', pathname);
      return NextResponse.redirect(url);
    }

    // Перевірка прав доступу для адміністративних маршрутів
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      // Перевіримо чи користувач має роль адміністратора
      // Для цього потрібно додатково перевірити роль у токені або в базі даних
      const isAdmin = payload.role === 'admin';

      if (!isAdmin) {
        AuthLogger.warn('Forbidden access attempt', {
          userId: payload.userId,
          pathname,
          clientIP,
          userAgent,
          reason: 'Admin access required',
        });

        // Якщо це API запит, повертаємо 403
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Інакше перенаправляємо на головну сторінку
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Додаємо інформацію про користувача до запиту
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);
    if (payload.role) {
      requestHeaders.set('x-user-role', payload.role);
    }

    // Логування успішного доступу
    AuthLogger.info('User authenticated', {
      userId: payload.userId,
      pathname,
      clientIP,
      userAgent,
    });

    // Продовжуємо обробку запиту
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    AuthLogger.error('Auth middleware error', {
      pathname,
      clientIP,
      userAgent,
      error,
    });

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
