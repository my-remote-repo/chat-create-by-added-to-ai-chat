// src/lib/rate-limiter.ts
import { redisClient } from './redis-client';

export class RateLimiter {
  private readonly prefix: string;
  private readonly maxRequests: number;
  private readonly windowSeconds: number;

  /**
   * @param prefix Префікс для ключів лімітера
   * @param maxRequests Максимальна кількість запитів
   * @param windowSeconds Період в секундах
   */
  constructor(prefix: string, maxRequests: number, windowSeconds: number) {
    this.prefix = `ratelimit:${prefix}:`;
    this.maxRequests = maxRequests;
    this.windowSeconds = windowSeconds;
  }

  /**
   * Перевіряє чи ключ обмежений
   */
  async isLimited(key: string): Promise<boolean> {
    const redisKey = this.prefix + key;

    // Отримуємо поточну кількість запитів
    const count = await redisClient.get(redisKey);
    const currentCount = count ? parseInt(count, 10) : 0;

    // Якщо кількість перевищує ліміт, повертаємо true
    if (currentCount >= this.maxRequests) {
      return true;
    }

    // Інкрементуємо лічильник
    await redisClient.set(redisKey, (currentCount + 1).toString(), {
      EX: this.windowSeconds,
    });

    return false;
  }

  /**
   * Отримує залишок запитів
   */
  async getRemainingRequests(key: string): Promise<number> {
    const redisKey = this.prefix + key;

    // Отримуємо поточну кількість запитів
    const count = await redisClient.get(redisKey);
    const currentCount = count ? parseInt(count, 10) : 0;

    return Math.max(0, this.maxRequests - currentCount);
  }

  /**
   * Скидає ліміт для ключа
   */
  async reset(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    await redisClient.del(redisKey);
  }
}
