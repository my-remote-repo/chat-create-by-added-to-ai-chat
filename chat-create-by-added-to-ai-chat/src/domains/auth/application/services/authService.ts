// src/domains/auth/application/services/authService.ts
import { compare, hash } from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '@/domains/user/domain/repositories/userRepository';
import { User, UserDTO } from '@/domains/user/domain/entities/user';
import { redisClient } from '@/lib/redis-client';
import { JwtService } from '../../infrastructure/services/jwtService';
import { EmailService } from '../../infrastructure/services/emailService';
import { AuthLogger } from '../../infrastructure/services/authLogger';
import { prisma } from '@/lib/db';

export class AuthService {
  private readonly jwtService: JwtService;
  private readonly emailService: EmailService;

  constructor(private readonly userRepository: UserRepository) {
    this.jwtService = new JwtService();
    this.emailService = new EmailService();
  }

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
   * Відправка email для підтвердження
   */
  async sendVerificationEmail(userId: string, email: string, name: string): Promise<boolean> {
    // Створюємо унікальний токен
    const token = uuidv4();

    try {
      // Зберігаємо токен в базі використовуючи VerificationToken модель
      await prisma.verificationToken.create({
        data: {
          identifier: userId,
          token,
          expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 години
        },
      });

      // Відправляємо email
      return await this.emailService.sendVerificationEmail(email, name, token);
    } catch (error) {
      AuthLogger.error('Error sending verification email', { userId, email, error });
      return false;
    }
  }

  /**
   * Логін користувача
   */
  async login(
    email: string,
    password: string
  ): Promise<{ user: UserDTO; tokens: { accessToken: string; refreshToken: string } } | null> {
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
    await redisClient.setUserStatus(user.id, 'online');

    // Генеруємо JWT токени
    const tokens = await this.jwtService.generateTokens(user.id, user.email);

    // Зберігаємо refresh токен - використовуємо модель Session замість RefreshToken
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: user.toDTO(),
      tokens,
    };
  }

  /**
   * Зберігає refresh токен
   */
  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    // Використовуємо модель Session для збереження refresh токена
    await prisma.session.create({
      data: {
        userId,
        sessionToken: token,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 днів
      },
    });
  }

  /**
   * Перевіряє чи валідний refresh токен
   */
  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const storedToken = await prisma.session.findFirst({
      where: {
        userId,
        sessionToken: token,
        expires: {
          gt: new Date(),
        },
      },
    });

    return !!storedToken;
  }

  /**
   * Оновлює refresh токен
   */
  async updateRefreshToken(userId: string, oldToken: string, newToken: string): Promise<void> {
    // Видаляємо старий токен
    await prisma.session.deleteMany({
      where: {
        userId,
        sessionToken: oldToken,
      },
    });

    // Зберігаємо новий токен
    await this.saveRefreshToken(userId, newToken);
  }

  /**
   * Відключення всіх refresh токенів користувача
   */
  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  }

  /**
   * Вихід користувача
   */
  async logout(userId: string, refreshToken?: string, accessToken?: string): Promise<boolean> {
    // Оновлюємо статус користувача
    await redisClient.setUserStatus(userId, 'offline');

    try {
      // Якщо переданий access токен, додаємо його до чорного списку
      if (accessToken) {
        // Визначаємо залишковий час життя токена (15 хвилин)
        const expiresInSeconds = 15 * 60;
        await redisClient.addToBlacklist(accessToken, expiresInSeconds);
        console.log(`Токен користувача ${userId} додано до чорного списку`);
      }

      // Якщо передано refresh токен, видаляємо сесію
      if (refreshToken) {
        await prisma.session.deleteMany({
          where: {
            userId,
            sessionToken: refreshToken,
          },
        });
        console.log(`Сесію користувача ${userId} видалено`);
      }
    } catch (error) {
      console.error('Помилка при логауті:', error);
    }

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
    const token = uuidv4();

    try {
      // Створюємо запис в базі даних для скидання пароля
      await prisma.verificationToken.create({
        data: {
          identifier: user.id,
          token,
          expires: new Date(Date.now() + 1 * 60 * 60 * 1000), // термін дії 1 година
        },
      });

      // Відправляємо email
      return await this.emailService.sendPasswordResetEmail(email, user.name, token);
    } catch (error) {
      AuthLogger.error('Error initiating password reset', { email, error });
      return false;
    }
  }

  /**
   * Завершення скидання пароля
   */
  async completePasswordReset(token: string, newPassword: string): Promise<boolean> {
    try {
      console.log('Початок completePasswordReset з токеном:', token);
      // Отримуємо запис токена з бази даних
      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          token,
          expires: {
            gt: new Date(),
          },
        },
      });

      console.log('Результат пошуку токена:', tokenRecord ? 'Знайдено' : 'Не знайдено');
      if (tokenRecord) {
        console.log('Деталі токена:', {
          identifier: tokenRecord.identifier,
          expires: tokenRecord.expires,
          isExpired: tokenRecord.expires < new Date(),
        });
      }

      if (!tokenRecord) {
        console.log('Токен не знайдено в базі даних');
        return false; // Токен недійсний, неправильного типу або термін дії закінчився
      }

      // Отримуємо користувача
      const user = await this.userRepository.findById(tokenRecord.identifier);

      if (!user) {
        console.log('не знайдено користувача');
        return false;
      }

      // Хешування нового пароля
      const hashedPassword = await hash(newPassword, 12);

      // Оновлюємо пароль користувача
      await prisma.user.update({
        where: { id: tokenRecord.identifier },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      // Видаляємо запис токена
      await prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      });

      // Відключаємо всі refresh токени
      await this.revokeAllRefreshTokens(user.id);

      return true;
    } catch (error) {
      console.error('Помилка в completePasswordReset:', error);
      AuthLogger.error('Error completing password reset', { token, error });
      return false;
    }
  }

  /**
   * Верифікація email
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Отримуємо запис токена з бази даних
      const tokenRecord = await prisma.verificationToken.findFirst({
        where: {
          token,
          expires: {
            gt: new Date(),
          },
        },
      });

      if (!tokenRecord) {
        return false; // Токен недійсний, неправильного типу або термін дії закінчився
      }

      // Отримуємо користувача
      const user = await this.userRepository.findById(tokenRecord.identifier);

      if (!user) {
        return false;
      }

      // Верифікуємо email
      const verifiedUser = user.verifyEmail();
      await this.userRepository.update(verifiedUser);

      // Видаляємо запис токена
      await prisma.verificationToken.delete({
        where: { id: tokenRecord.id },
      });

      return true;
    } catch (error) {
      AuthLogger.error('Error verifying email', { token, error });
      return false;
    }
  }
}
