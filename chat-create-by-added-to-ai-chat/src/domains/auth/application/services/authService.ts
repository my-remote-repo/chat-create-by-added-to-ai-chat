import { compare, hash } from 'bcryptjs';
import { UserRepository } from '@/domains/user/domain/repositories/userRepository';
import { User, UserDTO } from '@/domains/user/domain/entities/user';
import { redisClient } from '@/lib/redis-client';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Реєстрація нового користувача
   */
  async register(name: string, email: string, password: string): Promise<UserDTO | null> {
    // Перевірка, чи існує користувач з таким email
    const exists = await this.userRepository.existsByEmail(email);

    if (exists) {
      return null; // Користувач вже існує
    }

    // Хешування пароля
    const hashedPassword = await hash(password, 12);

    // Створення користувача
    const user = new User({
      id: '', // буде згенеровано базою даних
      name,
      email,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Зберігаємо користувача
    const createdUser = await this.userRepository.create(user);

    return createdUser.toDTO();
  }

  /**
   * Логін користувача
   */
  async login(email: string, password: string): Promise<UserDTO | null> {
    // Пошук користувача
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return null; // Користувач не знайдений
    }

    // Перевірка пароля
    const isValid = await compare(password, (user as any).props.password);

    if (!isValid) {
      return null; // Неправильний пароль
    }

    // Оновлюємо статус користувача
    await redisClient.setUserStatus(user.id, 'online'); // Змінено з 'ONLINE' на малі літери

    return user.toDTO();
  }

  /**
   * Вихід користувача
   */
  async logout(userId: string): Promise<boolean> {
    // Оновлюємо статус користувача
    await redisClient.setUserStatus(userId, 'offline'); // Змінено з 'OFFLINE' на малі літери

    return true;
  }

  /**
   * Перевірка токена сесії
   */
  async validateSession(userId: string, sessionId: string): Promise<boolean> {
    const session = await redisClient.getUserSession(userId, sessionId);

    return !!session;
  }

  /**
   * Скинути пароль (починає процес)
   */
  async initiatePasswordReset(email: string): Promise<boolean> {
    // Пошук користувача
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return false; // Користувач не знайдений
    }

    // Генерація токена для скидання пароля
    const token =
      Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
      // Створюємо запис в базі даних для скидання пароля
      const { prisma } = require('@/lib/db');

      await prisma.userToken.create({
        data: {
          userId: user.id,
          token: token,
          type: 'reset_password',
          expiresAt: new Date(Date.now() + 3600 * 1000), // термін дії 1 година
        },
      });

      // TODO: Відправити email з посиланням для скидання пароля

      return true;
    } catch (error) {
      console.error('Error storing password reset token:', error);
      return false;
    }
  }

  /**
   * Завершення скидання пароля
   */
  async completePasswordReset(token: string, newPassword: string): Promise<boolean> {
    try {
      // Отримуємо запис токена з бази даних
      const { prisma } = require('@/lib/db');

      const tokenRecord = await prisma.userToken.findUnique({
        where: { token },
      });

      if (
        !tokenRecord ||
        tokenRecord.type !== 'reset_password' ||
        tokenRecord.expiresAt < new Date()
      ) {
        return false; // Токен недійсний, неправильного типу або термін дії закінчився
      }

      // Отримуємо користувача
      const user = await this.userRepository.findById(tokenRecord.userId);

      if (!user) {
        return false;
      }

      // Хешування нового пароля
      const hashedPassword = await hash(newPassword, 12);

      // Оновлюємо пароль користувача
      await prisma.user.update({
        where: { id: tokenRecord.userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      // Видаляємо запис токена
      await prisma.userToken.delete({
        where: { id: tokenRecord.id },
      });

      return true;
    } catch (error) {
      console.error('Error completing password reset:', error);
      return false;
    }
  }

  /**
   * Верифікація email
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Отримуємо запис токена з бази даних
      const { prisma } = require('@/lib/db');

      const tokenRecord = await prisma.userToken.findUnique({
        where: { token },
      });

      if (
        !tokenRecord ||
        tokenRecord.type !== 'email_verification' ||
        tokenRecord.expiresAt < new Date()
      ) {
        return false; // Токен недійсний, неправильного типу або термін дії закінчився
      }

      // Отримуємо користувача
      const user = await this.userRepository.findById(tokenRecord.userId);

      if (!user) {
        return false;
      }

      // Верифікуємо email
      const verifiedUser = user.verifyEmail();
      await this.userRepository.update(verifiedUser);

      // Видаляємо запис токена
      await prisma.userToken.delete({
        where: { id: tokenRecord.id },
      });

      return true;
    } catch (error) {
      console.error('Error verifying email:', error);
      return false;
    }
  }
}
