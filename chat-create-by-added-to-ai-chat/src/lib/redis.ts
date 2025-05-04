/**
 * Спрощений інтерфейс для роботи з Redis
 * Примітка: Це просто інтерфейс для TypeScript, фактична імплементація
 * буде додана після встановлення відповідних пакетів
 */

// Типи ключів для Redis
export enum RedisKeyType {
  USER_SESSION = 'user:session:',
  USER_STATUS = 'user:status:',
  USER_TYPING = 'typing:',
  CHAT_MEMBERS_ONLINE = 'chat:online:',
  MESSAGE_CACHE = 'message:',
  NOTIFICATIONS = 'notifications:',
}

// Інтерфейс для сервісу Redis
export interface IRedisService {
  // Методи для роботи з сесіями
  storeUserSession(userId: string, sessionData: any, expiresInSeconds?: number): Promise<string>;
  getUserSession(userId: string, sessionId: string): Promise<any | null>;
  removeUserSession(userId: string, sessionId: string): Promise<void>;

  // Методи для статусів користувачів
  setUserStatus(userId: string, status: 'online' | 'offline' | 'away' | 'busy'): Promise<void>;
  getUserStatus(userId: string): Promise<string>;

  // Методи для набору тексту
  setUserTyping(chatId: string, userId: string, isTyping: boolean): Promise<void>;
  getUsersTyping(chatId: string): Promise<string[]>;

  // Методи для онлайн-учасників чату
  addUserToChat(chatId: string, userId: string): Promise<void>;
  removeUserFromChat(chatId: string, userId: string): Promise<void>;
  getChatOnlineMembers(chatId: string): Promise<string[]>;

  // Методи для кешування повідомлень
  cacheMessage(message: any, expiresInSeconds?: number): Promise<void>;
  getCachedMessage(messageId: string): Promise<any | null>;

  // Методи для сповіщень
  addNotification(userId: string, notification: any): Promise<void>;
  getNotifications(userId: string, limit?: number): Promise<any[]>;
  markNotificationsAsRead(userId: string): Promise<void>;
}

/**
 * Фейкова імплементація Redis сервісу для розробки
 * У продакшені цей клас буде замінено на справжню імплементацію
 */
export class FakeRedisService implements IRedisService {
  private storage: Map<string, any> = new Map();
  private sessionIds: Map<string, Set<string>> = new Map();
  private typingUsers: Map<string, Set<string>> = new Map();
  private chatMembers: Map<string, Set<string>> = new Map();
  private userNotifications: Map<string, any[]> = new Map();

  // Допоміжний метод для роботи з ключами
  private getKey(type: RedisKeyType, id: string, secondaryId?: string): string {
    if (secondaryId) {
      return `${type}${id}:${secondaryId}`;
    }
    return `${type}${id}`;
  }

  // Імплементація методів для сесій
  async storeUserSession(
    userId: string,
    sessionData: any,
    expiresInSeconds: number = 86400
  ): Promise<string> {
    const sessionId = Math.random().toString(36).substring(2, 15);
    const key = this.getKey(RedisKeyType.USER_SESSION, userId, sessionId);

    this.storage.set(key, {
      ...sessionData,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    });

    // Зберігаємо зв'язок між користувачем та сесіями
    if (!this.sessionIds.has(userId)) {
      this.sessionIds.set(userId, new Set());
    }
    this.sessionIds.get(userId)!.add(sessionId);

    return sessionId;
  }

  async getUserSession(userId: string, sessionId: string): Promise<any | null> {
    const key = this.getKey(RedisKeyType.USER_SESSION, userId, sessionId);
    const session = this.storage.get(key);

    if (!session) return null;

    // Перевірка терміну дії
    if (new Date(session.expiresAt) < new Date()) {
      this.storage.delete(key);
      this.sessionIds.get(userId)?.delete(sessionId);
      return null;
    }

    return session;
  }

  async removeUserSession(userId: string, sessionId: string): Promise<void> {
    const key = this.getKey(RedisKeyType.USER_SESSION, userId, sessionId);
    this.storage.delete(key);
    this.sessionIds.get(userId)?.delete(sessionId);
  }

  // Імплементація методів для статусів користувачів
  async setUserStatus(
    userId: string,
    status: 'online' | 'offline' | 'away' | 'busy'
  ): Promise<void> {
    const key = this.getKey(RedisKeyType.USER_STATUS, userId);
    this.storage.set(key, status);
  }

  async getUserStatus(userId: string): Promise<string> {
    const key = this.getKey(RedisKeyType.USER_STATUS, userId);
    return this.storage.get(key) || 'offline';
  }

  // Імплементація методів для набору тексту
  async setUserTyping(chatId: string, userId: string, isTyping: boolean): Promise<void> {
    const chatKey = chatId;

    if (!this.typingUsers.has(chatKey)) {
      this.typingUsers.set(chatKey, new Set());
    }

    if (isTyping) {
      this.typingUsers.get(chatKey)!.add(userId);

      // Автоматично видаляємо через 5 секунд
      setTimeout(() => {
        this.typingUsers.get(chatKey)?.delete(userId);
      }, 5000);
    } else {
      this.typingUsers.get(chatKey)!.delete(userId);
    }
  }

  async getUsersTyping(chatId: string): Promise<string[]> {
    const chatKey = chatId;
    return Array.from(this.typingUsers.get(chatKey) || []);
  }

  // Імплементація методів для онлайн-учасників чату
  async addUserToChat(chatId: string, userId: string): Promise<void> {
    if (!this.chatMembers.has(chatId)) {
      this.chatMembers.set(chatId, new Set());
    }
    this.chatMembers.get(chatId)!.add(userId);
  }

  async removeUserFromChat(chatId: string, userId: string): Promise<void> {
    this.chatMembers.get(chatId)?.delete(userId);
  }

  async getChatOnlineMembers(chatId: string): Promise<string[]> {
    return Array.from(this.chatMembers.get(chatId) || []);
  }

  // Імплементація методів для кешування повідомлень
  async cacheMessage(message: any, expiresInSeconds: number = 3600): Promise<void> {
    const key = this.getKey(RedisKeyType.MESSAGE_CACHE, message.id);
    this.storage.set(key, {
      ...message,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
    });

    // Автоматичне видалення після закінчення терміну
    setTimeout(() => {
      this.storage.delete(key);
    }, expiresInSeconds * 1000);
  }

  async getCachedMessage(messageId: string): Promise<any | null> {
    const key = this.getKey(RedisKeyType.MESSAGE_CACHE, messageId);
    const message = this.storage.get(key);

    if (!message) return null;

    // Перевірка терміну дії
    if (new Date(message.expiresAt) < new Date()) {
      this.storage.delete(key);
      return null;
    }

    return message;
  }

  // Імплементація методів для сповіщень
  async addNotification(userId: string, notification: any): Promise<void> {
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }

    this.userNotifications.get(userId)!.unshift({
      ...notification,
      createdAt: new Date().toISOString(),
      read: false,
    });

    // Обмежуємо кількість сповіщень до 100
    const notifications = this.userNotifications.get(userId)!;
    if (notifications.length > 100) {
      this.userNotifications.set(userId, notifications.slice(0, 100));
    }
  }

  async getNotifications(userId: string, limit: number = 20): Promise<any[]> {
    const notifications = this.userNotifications.get(userId) || [];
    return notifications.slice(0, limit);
  }

  async markNotificationsAsRead(userId: string): Promise<void> {
    const notifications = this.userNotifications.get(userId);

    if (!notifications) return;

    this.userNotifications.set(
      userId,
      notifications.map(note => ({ ...note, read: true }))
    );
  }
}

// Експорт типів та сервісу
// export type RedisService = IRedisService;
// export const redisService: RedisService = new FakeRedisService();
// Замість цього використовуйте заглушку
import { MockRedisService } from './mock-redis-client';
export const redisClient = new MockRedisService();
