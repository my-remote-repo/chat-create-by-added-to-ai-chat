import { createClient, RedisClientType } from 'redis';
import { IRedisService, RedisKeyType } from './redis';

export class RedisService implements IRedisService {
  private client: RedisClientType;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', err => {
      console.error('Redis connection error:', err);
    });

    // Підключаємось автоматично при створенні інстансу
    this.connect();
  }

  private async connect() {
    if (!this.client.isOpen) {
      try {
        await this.client.connect();
      } catch (error) {
        console.error('Error connecting to Redis:', error);
      }
    }
  }

  // Допоміжний метод для роботи з ключами
  private getKey(type: RedisKeyType, id: string, secondaryId?: string): string {
    if (secondaryId) {
      return `${type}${id}:${secondaryId}`;
    }
    return `${type}${id}`;
  }

  // Методи для сесій
  async storeUserSession(
    userId: string,
    sessionData: any,
    expiresInSeconds: number = 86400
  ): Promise<string> {
    await this.connect();
    const sessionId = Math.random().toString(36).substring(2, 15);
    const key = this.getKey(RedisKeyType.USER_SESSION, userId, sessionId);

    await this.client.set(
      key,
      JSON.stringify({
        ...sessionData,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      }),
      { EX: expiresInSeconds }
    );

    // Зберігаємо зв'язок між користувачем та сесіями
    await this.client.sAdd(this.getKey(RedisKeyType.USER_SESSION, userId), sessionId);

    return sessionId;
  }

  async getUserSession(userId: string, sessionId: string): Promise<any | null> {
    await this.connect();
    const key = this.getKey(RedisKeyType.USER_SESSION, userId, sessionId);
    const session = await this.client.get(key);

    if (!session) return null;

    try {
      const parsedSession = JSON.parse(session);

      // Перевірка терміну дії
      const expiresAt = new Date(parsedSession.expiresAt);
      if (expiresAt < new Date()) {
        await this.client.del(key);
        await this.client.sRem(this.getKey(RedisKeyType.USER_SESSION, userId), sessionId);
        return null;
      }

      return parsedSession;
    } catch (error) {
      console.error('Error parsing session:', error);
      return null;
    }
  }

  async removeUserSession(userId: string, sessionId: string): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.USER_SESSION, userId, sessionId);
    await this.client.del(key);
    await this.client.sRem(this.getKey(RedisKeyType.USER_SESSION, userId), sessionId);
  }

  // Методи для статусів користувачів
  async setUserStatus(
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy'
  ): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.USER_STATUS, userId);
    await this.client.set(key, status);

    // Якщо статус змінився на оффлайн, оновлюємо час останньої активності
    if (status === 'offline') {
      await this.client.set(
        this.getKey(RedisKeyType.USER_STATUS, userId, 'lastSeen'),
        new Date().toISOString()
      );
    }
  }

  async getUserStatus(userId: string): Promise<string> {
    await this.connect();
    const key = this.getKey(RedisKeyType.USER_STATUS, userId);
    const status = await this.client.get(key);
    return status || 'offline';
  }

  // Методи для набору тексту
  async setUserTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.USER_TYPING, chatId);

    if (isTyping) {
      await this.client.hSet(key, userId, new Date().toISOString());
      // Автоматично видаляємо статус через 5 секунд
      setTimeout(async () => {
        await this.client.hDel(key, userId);
      }, 5000);
    } else {
      await this.client.hDel(key, userId);
    }
  }

  async getUsersTyping(chatId: string): Promise<string[]> {
    await this.connect();
    const key = this.getKey(RedisKeyType.USER_TYPING, chatId);

    // Отримуємо всі поля хешу як об'єкт
    const typingData = await this.client.hGetAll(key);

    // Перетворюємо ключі об'єкта на масив, фільтруючи за часом
    return Object.entries(typingData)
      .filter(([userId, timestampStr]) => {
        // Перевіряємо, що timestamp це рядок
        if (typeof timestampStr !== 'string') {
          return false;
        }

        try {
          // Конвертуємо рядковий timestamp у число
          const typingTime = new Date(timestampStr).getTime();
          // Перевіряємо, чи не минуло більше 5 секунд
          return Date.now() - typingTime < 5000;
        } catch (error) {
          console.error('Error parsing timestamp:', error);
          return false;
        }
      })
      .map(([userId]) => userId);
  }

  // Методи для онлайн-учасників чату
  async addUserToChat(chatId: string, userId: string): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.CHAT_MEMBERS_ONLINE, chatId);
    await this.client.sAdd(key, userId);
  }

  async removeUserFromChat(chatId: string, userId: string): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.CHAT_MEMBERS_ONLINE, chatId);
    await this.client.sRem(key, userId);
  }

  async getChatOnlineMembers(chatId: string): Promise<string[]> {
    await this.connect();
    const key = this.getKey(RedisKeyType.CHAT_MEMBERS_ONLINE, chatId);
    return this.client.sMembers(key);
  }

  // Методи для кешування повідомлень
  async cacheMessage(message: any, expiresInSeconds: number = 3600): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.MESSAGE_CACHE, message.id);
    await this.client.set(key, JSON.stringify(message), { EX: expiresInSeconds });
  }

  async getCachedMessage(messageId: string): Promise<any | null> {
    await this.connect();
    const key = this.getKey(RedisKeyType.MESSAGE_CACHE, messageId);
    const message = await this.client.get(key);

    if (!message) return null;

    try {
      return JSON.parse(message);
    } catch (error) {
      console.error('Error parsing cached message:', error);
      return null;
    }
  }

  // Методи для сповіщень
  async addNotification(userId: string, notification: any): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.NOTIFICATIONS, userId);

    try {
      // Отримуємо існуючі сповіщення
      const existingNotifications = await this.client.get(key);
      const notifications = existingNotifications ? JSON.parse(existingNotifications) : [];

      // Додаємо нове сповіщення
      notifications.unshift({
        ...notification,
        createdAt: new Date().toISOString(),
        read: false,
      });

      // Обмежуємо кількість сповіщень до 100
      const limitedNotifications = notifications.slice(0, 100);

      // Зберігаємо оновлений список
      await this.client.set(key, JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  }

  async getNotifications(userId: string, limit: number = 20): Promise<any[]> {
    await this.connect();
    const key = this.getKey(RedisKeyType.NOTIFICATIONS, userId);

    try {
      const notifications = await this.client.get(key);
      const parsedNotifications = notifications ? JSON.parse(notifications) : [];

      return parsedNotifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  async markNotificationsAsRead(userId: string): Promise<void> {
    await this.connect();
    const key = this.getKey(RedisKeyType.NOTIFICATIONS, userId);

    try {
      const notifications = await this.client.get(key);

      if (!notifications) return;

      const parsedNotifications = JSON.parse(notifications);
      const updatedNotifications = parsedNotifications.map((note: any) => ({
        ...note,
        read: true,
      }));

      await this.client.set(key, JSON.stringify(updatedNotifications));
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }

  // Додаткові корисні методи для роботи з Redis
  async publish(channel: string, message: string): Promise<number> {
    await this.connect();
    return this.client.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    // Для підписки потрібен окремий клієнт
    const subscriber = this.client.duplicate();
    await subscriber.connect();

    await subscriber.subscribe(channel, message => {
      callback(message);
    });
  }

  async hDel(key: string, field: string): Promise<number> {
    await this.connect();
    return this.client.hDel(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    await this.connect();
    return this.client.hSet(key, field, value);
  }

  async hGet(key: string, field: string): Promise<string | null> {
    await this.connect();
    return this.client.hGet(key, field);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    await this.connect();
    // Тут потрібне додаткове приведення типів - переконуємося, що повертається Record<string, string>
    const result = await this.client.hGetAll(key);

    // Переконуємося, що всі значення є рядками
    const stringResult: Record<string, string> = {};

    Object.entries(result).forEach(([k, v]) => {
      stringResult[k] = String(v);
    });

    return stringResult;
  }

  async set(key: string, value: string, options?: any): Promise<string | null> {
    await this.connect();
    return this.client.set(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    await this.connect();
    return this.client.get(key);
  }

  async del(key: string): Promise<number> {
    await this.connect();
    return this.client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    await this.connect();
    return this.client.keys(pattern);
  }

  async exists(key: string): Promise<number> {
    await this.connect();
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    await this.connect();
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    await this.connect();
    return this.client.ttl(key);
  }

  async sAdd(key: string, ...members: string[]): Promise<number> {
    await this.connect();
    return this.client.sAdd(key, members);
  }

  async sMembers(key: string): Promise<string[]> {
    await this.connect();
    return this.client.sMembers(key);
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    await this.connect();
    return this.client.sRem(key, members);
  }

  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }
}

// Створюємо і експортуємо інстанс сервісу
// export const redisClient = new RedisService();

// Замість цього використовуйте заглушку
import { MockRedisService } from './mock-redis-client';
export const redisClient = new MockRedisService();
