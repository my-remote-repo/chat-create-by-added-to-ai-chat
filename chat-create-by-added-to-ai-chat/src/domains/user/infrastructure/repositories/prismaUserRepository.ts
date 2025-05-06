// src/domains/user/infrastructure/repositories/prismaUserRepository.ts
import { prisma } from '@/lib/db';
import { User, UserProps } from '../../domain/entities/user';
import { UserSettings, UserSettingsProps } from '../../domain/entities/userSettings';
import { UserRepository } from '../../domain/repositories/userRepository';
import { redisClient } from '@/lib/redis-client';

/**
 * Prisma імплементація UserRepository
 * Відповідає за взаємодію з базою даних через Prisma ORM
 */
export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return new User(user as UserProps);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return new User(user as UserProps);
  }

  async create(user: User): Promise<User> {
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: (user as any).props.password, // Доступ до приватного поля
        image: user.image,
        bio: user.bio,
        emailVerified: user.emailVerified,
      },
    });

    return new User(createdUser as UserProps);
  }

  async update(user: User): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        image: user.image,
        bio: user.bio,
        emailVerified: user.emailVerified,
        updatedAt: new Date(),
      },
    });

    return new User(updatedUser as UserProps);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async searchByName(query: string, limit: number = 10): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
    });

    // Додайте явну типізацію для параметра user
    return users.map((user: any) => new User(user as UserProps));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });

    return count > 0;
  }

  async findUserSettings(userId: string): Promise<UserSettings | null> {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      return null;
    }

    return new UserSettings({
      id: settings.id,
      userId: settings.userId,
      theme: settings.theme,
      language: settings.language,
      notificationsEnabled: settings.notificationsEnabled,
      soundsEnabled: settings.soundsEnabled,
      desktopNotifications: settings.desktopNotifications,
      emailNotifications: settings.emailNotifications,
      showReadReceipts: settings.showReadReceipts,
      showOnlineStatus: settings.showOnlineStatus,
    });
  }

  async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    // Якщо вже є налаштування, оновлюємо, якщо немає - створюємо
    const existingSettings = await prisma.userSettings.findUnique({
      where: { userId: settings.userId },
    });

    let updatedSettings;

    if (existingSettings) {
      updatedSettings = await prisma.userSettings.update({
        where: { userId: settings.userId },
        data: {
          theme: settings.theme,
          language: settings.language,
          notificationsEnabled: settings.notificationsEnabled,
          soundsEnabled: settings.soundsEnabled,
          desktopNotifications: settings.desktopNotifications,
          emailNotifications: settings.emailNotifications,
          showReadReceipts: settings.showReadReceipts,
          showOnlineStatus: settings.showOnlineStatus,
        },
      });
    } else {
      updatedSettings = await prisma.userSettings.create({
        data: {
          userId: settings.userId,
          theme: settings.theme,
          language: settings.language,
          notificationsEnabled: settings.notificationsEnabled,
          soundsEnabled: settings.soundsEnabled,
          desktopNotifications: settings.desktopNotifications,
          emailNotifications: settings.emailNotifications,
          showReadReceipts: settings.showReadReceipts,
          showOnlineStatus: settings.showOnlineStatus,
        },
      });
    }

    return new UserSettings(updatedSettings as UserSettingsProps);
  }

  async getUsersWithStatus(status: string, limit: number = 20): Promise<User[]> {
    // Для ефективності, використовуємо Redis для отримання статусів
    const userIds = await redisClient.getUsersByStatus(status);

    if (userIds.length === 0) {
      return [];
    }

    // Обмежуємо кількість запитуваних користувачів
    const limitedUserIds = userIds.slice(0, limit);

    // Отримуємо деталі користувачів з бази даних
    const users = await prisma.user.findMany({
      where: {
        id: { in: limitedUserIds },
      },
    });

    return users.map(user => new User(user as UserProps));
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    // Оновлюємо статус у базі даних
    await prisma.user.update({
      where: { id: userId },
      data: {
        status,
        lastSeen: new Date(),
      },
    });

    // Оновлюємо статус у Redis
    await redisClient.setUserStatus(userId, status as any);
  }
}
