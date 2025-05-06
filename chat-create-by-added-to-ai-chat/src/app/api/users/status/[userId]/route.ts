import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';
import { redisClient } from '@/lib/redis-client';

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Отримання статусу з Redis
    const status = await redisClient.getUserStatus(userId);

    // Отримання часу останньої активності з БД
    const userService = ServiceFactory.createUserService();
    const user = await userService.getUserProfile(userId);

    return NextResponse.json({
      userId,
      status,
      lastSeen: user?.lastSeen || null,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
