// src/app/api/auth/blacklist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis-client';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';

// Функція для перевірки авторизації
async function checkAuth(req: NextRequest) {
  // Отримання токена авторизації
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return { isAuthorized: false, error: 'Unauthorized', statusCode: 401 };
  }

  try {
    // Перевірка токена
    const jwtService = new JwtService();
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return { isAuthorized: false, error: 'Invalid token', statusCode: 401 };
    }

    return { isAuthorized: true, userId: payload.userId };
  } catch (error) {
    console.error('Auth error:', error);
    return { isAuthorized: false, error: 'Invalid token', statusCode: 401 };
  }
}

// Отримання інформації про чорний список
export async function GET(req: NextRequest) {
  // Перевірка авторизації
  const authResult = await checkAuth(req);
  if (!authResult.isAuthorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    // Спрощений підхід - повертаємо базову інформацію
    return NextResponse.json({
      success: true,
      message: 'Функція перегляду чорного списку працює',
      note: 'Для повного перегляду списку додайте метод keys() до RedisService',
    });
  } catch (error) {
    console.error('Blacklist check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Додавання токена до чорного списку
export async function POST(req: NextRequest) {
  // Перевірка авторизації
  const authResult = await checkAuth(req);
  if (!authResult.isAuthorized) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
  }

  try {
    const data = await req.json();
    const { token, expiresInSeconds = 300 } = data;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // Додаємо токен до чорного списку
    await redisClient.set(`blacklist:token:${token}`, '1', { EX: expiresInSeconds });

    console.log(`Токен додано до чорного списку. Закінчується через ${expiresInSeconds} сек.`);

    return NextResponse.json({
      success: true,
      message: `Токен додано до чорного списку. Буде видалено через ${expiresInSeconds} секунд`,
    });
  } catch (error) {
    console.error('Blacklist add error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Перевірка, чи токен у чорному списку
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { token } = data;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token is required' }, { status: 400 });
    }

    // Перевіряємо, чи токен у чорному списку
    const value = await redisClient.get(`blacklist:token:${token}`);
    const isBlacklisted = value !== null;

    return NextResponse.json({
      success: true,
      isBlacklisted,
      message: isBlacklisted
        ? 'Токен знаходиться в чорному списку'
        : 'Токен не знаходиться в чорному списку',
    });
  } catch (error) {
    console.error('Blacklist check error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
