// src/lib/blacklist-service.ts
import { redisClient } from './redis-client';

export class BlacklistService {
  private readonly keyPrefix = 'blacklist:token:';

  async addToBlacklist(token: string, expiresInSeconds: number): Promise<void> {
    const key = `${this.keyPrefix}${token}`;
    await redisClient.set(key, '1', { EX: expiresInSeconds });
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const key = `${this.keyPrefix}${token}`;
    const value = await redisClient.get(key);
    return value !== null;
  }

  async getBlacklistInfo(): Promise<{
    count: number;
    tokens: { token: string; expiresIn: number }[];
  }> {
    // Спрощений варіант, якщо у redisClient немає методу keys
    return {
      count: 0,
      tokens: [],
    };
  }
}

// Експортуємо singleton
export const blacklistService = new BlacklistService();
