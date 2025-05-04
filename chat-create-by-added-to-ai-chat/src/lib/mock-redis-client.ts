// src/lib/mock-redis-client.ts
export class MockRedisService {
  private storage: Map<string, any> = new Map();
  private userStatuses: Map<string, string> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private userSessions: Map<string, Map<string, any>> = new Map();
  private keyValueStorage: Map<string, string> = new Map();
  private keyExpiry: Map<string, number> = new Map();

  // Методи для статусів користувачів
  async setUserStatus(
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy'
  ): Promise<void> {
    console.log(`[Mock Redis] Setting user ${userId} status to ${status}`);
    this.userStatuses.set(userId, status);
  }

  async getUserStatus(userId: string): Promise<string> {
    return this.userStatuses.get(userId) || 'offline';
  }

  // Методи для набору тексту
  async setUserTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    console.log(
      `[Mock Redis] User ${userId} is ${isTyping ? 'typing' : 'not typing'} in chat ${chatId}`
    );

    if (!this.typingUsers.has(chatId)) {
      this.typingUsers.set(chatId, new Set());
    }

    const chatUsers = this.typingUsers.get(chatId)!;

    if (isTyping) {
      chatUsers.add(userId);
    } else {
      chatUsers.delete(userId);
    }
  }

  async getUsersTyping(chatId: string): Promise<string[]> {
    return Array.from(this.typingUsers.get(chatId) || []);
  }

  // Методи для сесій
  async getUserSession(userId: string, sessionId: string): Promise<any | null> {
    if (!this.userSessions.has(userId)) {
      return null;
    }

    return this.userSessions.get(userId)?.get(sessionId) || null;
  }

  async storeUserSession(
    userId: string,
    sessionData: any,
    expiresInSeconds: number = 86400
  ): Promise<string> {
    const sessionId = Math.random().toString(36).substring(2, 15);

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, new Map());
    }

    this.userSessions.get(userId)!.set(sessionId, {
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    });

    return sessionId;
  }

  async removeUserSession(userId: string, sessionId: string): Promise<void> {
    this.userSessions.get(userId)?.delete(sessionId);
  }

  // Загальні методи для роботи з ключами і значеннями (для rate-limiter.ts)
  async set(key: string, value: string, options?: { EX?: number }): Promise<string | null> {
    console.log(`[Mock Redis] Setting key "${key}" to "${value}"`);
    this.keyValueStorage.set(key, value);

    // Якщо встановлено час життя
    if (options?.EX) {
      this.keyExpiry.set(key, Date.now() + options.EX * 1000);

      // Запланувати видалення ключа
      setTimeout(() => {
        if (this.keyValueStorage.has(key)) {
          console.log(`[Mock Redis] Expiring key "${key}"`);
          this.keyValueStorage.delete(key);
          this.keyExpiry.delete(key);
        }
      }, options.EX * 1000);
    }

    return value;
  }

  async get(key: string): Promise<string | null> {
    // Перевіряємо, чи ключ не протермінований
    const expiry = this.keyExpiry.get(key);
    if (expiry && expiry < Date.now()) {
      console.log(`[Mock Redis] Key "${key}" has expired`);
      this.keyValueStorage.delete(key);
      this.keyExpiry.delete(key);
      return null;
    }

    const value = this.keyValueStorage.get(key);
    console.log(
      `[Mock Redis] Getting key "${key}" - ${value !== undefined ? `"${value}"` : 'null'}`
    );
    return value || null;
  }

  async del(key: string): Promise<number> {
    console.log(`[Mock Redis] Deleting key "${key}"`);
    const existed = this.keyValueStorage.has(key);
    this.keyValueStorage.delete(key);
    this.keyExpiry.delete(key);
    return existed ? 1 : 0;
  }

  // Методи для роботи з set, hash тощо можна додати за потреби
  async hSet(key: string, field: string, value: string): Promise<number> {
    console.log(`[Mock Redis] hSet ${key} ${field} ${value}`);
    return 1;
  }

  async hGet(key: string, field: string): Promise<string | null> {
    console.log(`[Mock Redis] hGet ${key} ${field}`);
    return null;
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    console.log(`[Mock Redis] hGetAll ${key}`);
    return {};
  }

  async hDel(key: string, field: string): Promise<number> {
    console.log(`[Mock Redis] hDel ${key} ${field}`);
    return 0;
  }

  async sAdd(key: string, ...members: string[]): Promise<number> {
    console.log(`[Mock Redis] sAdd ${key} ${members.join(', ')}`);
    return members.length;
  }

  async sMembers(key: string): Promise<string[]> {
    console.log(`[Mock Redis] sMembers ${key}`);
    return [];
  }

  async sRem(key: string, ...members: string[]): Promise<number> {
    console.log(`[Mock Redis] sRem ${key} ${members.join(', ')}`);
    return 0;
  }

  async publish(channel: string, message: string): Promise<number> {
    console.log(`[Mock Redis] publish ${channel} ${message}`);
    return 0;
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    console.log(`[Mock Redis] subscribe ${channel}`);
  }

  async exists(key: string): Promise<number> {
    const exists = this.keyValueStorage.has(key);
    console.log(`[Mock Redis] exists ${key} - ${exists ? 'true' : 'false'}`);
    return exists ? 1 : 0;
  }

  async expire(key: string, seconds: number): Promise<number> {
    console.log(`[Mock Redis] expire ${key} ${seconds}`);
    if (this.keyValueStorage.has(key)) {
      this.keyExpiry.set(key, Date.now() + seconds * 1000);
      return 1;
    }
    return 0;
  }

  async ttl(key: string): Promise<number> {
    console.log(`[Mock Redis] ttl ${key}`);
    const expiry = this.keyExpiry.get(key);
    if (expiry) {
      const remaining = Math.ceil((expiry - Date.now()) / 1000);
      return remaining > 0 ? remaining : -2;
    }
    return this.keyValueStorage.has(key) ? -1 : -2;
  }

  async close(): Promise<void> {
    console.log(`[Mock Redis] close`);
  }
}

// Експортуємо екземпляр заглушки
export const redisClient = new MockRedisService();
