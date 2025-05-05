// src/lib/auth-helpers.ts
import { NextRequest, NextResponse } from 'next/server';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { redisClient } from '@/lib/redis-client';

export async function verifyTokenAndCheckBlacklist(req: NextRequest) {
  // Отримання токена авторизації
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return { isAuthorized: false, error: 'Unauthorized', statusCode: 401 };
  }

  try {
    // Перевірка чорного списку
    const isBlacklisted = await redisClient.isBlacklisted(token);
    if (isBlacklisted) {
      return { isAuthorized: false, error: 'Token revoked', statusCode: 401 };
    }

    // Перевірка токена
    const jwtService = new JwtService();
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return { isAuthorized: false, error: 'Invalid token', statusCode: 401 };
    }

    return { isAuthorized: true, userId: payload.userId, email: payload.email, role: payload.role };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { isAuthorized: false, error: 'Invalid token', statusCode: 401 };
  }
}
