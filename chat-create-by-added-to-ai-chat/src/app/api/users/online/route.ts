import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';

export async function GET(req: NextRequest) {
  try {
    // Перевірка авторизації
    const authResult = await verifyTokenAndCheckBlacklist(req);
    if (!authResult.isAuthorized) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
    }

    // Отримання параметрів запиту
    const url = new URL(req.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Отримання онлайн-користувачів
    const userService = ServiceFactory.createUserService();
    const users = await userService.getOnlineUsers(limit);

    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching online users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
