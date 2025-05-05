// Оновіть файл src/app/api/test-redis/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redisClient } from '@/lib/redis-client';

export async function GET(req: NextRequest) {
  try {
    // Додаємо детальну інформацію про клас
    const clientType = redisClient.constructor.name;

    // Перевіряємо, чи це заглушка
    const isMock = clientType === 'MockRedisService';

    // Встановлюємо тестове значення
    const testKey = 'test-key-' + Date.now();
    await redisClient.set(testKey, 'Hello from Redis!');

    // Отримуємо значення
    const value = await redisClient.get(testKey);

    // Повертаємо детальний результат
    return NextResponse.json({
      success: true,
      value,
      clientType,
      isMock,
      message: `Підключення до ${isMock ? 'заглушки' : 'справжнього'} Redis працює коректно!`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Помилка підключення до Redis',
        error: error instanceof Error ? error.message : 'Невідома помилка',
      },
      { status: 500 }
    );
  }
}
