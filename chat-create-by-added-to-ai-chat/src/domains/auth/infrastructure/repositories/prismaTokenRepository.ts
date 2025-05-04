// src/domains/auth/infrastructure/repositories/prismaTokenRepository.ts
import { prisma } from '@/lib/db';
import { Token, TokenType } from '../../domain/entities/token';
import { TokenRepository } from '../../domain/repositories/tokenRepository';

export class PrismaTokenRepository implements TokenRepository {
  async create(token: Token): Promise<Token> {
    // В залежності від типу токена використовуємо різні моделі Prisma
    if (token.type === TokenType.RESET_PASSWORD || token.type === TokenType.EMAIL_VERIFICATION) {
      // Використовуємо VerificationToken модель з схеми Prisma
      const result = await prisma.verificationToken.create({
        data: {
          identifier: token.userId,
          token: token.token,
          expires: token.expiresAt,
        },
      });

      return new Token({
        id: result.id,
        userId: token.userId,
        token: result.token,
        type: token.type,
        expiresAt: result.expires,
        createdAt: new Date(),
      });
    } else if (token.type === TokenType.JWT_REFRESH) {
      // Використовуємо Session модель з схеми Prisma
      const result = await prisma.session.create({
        data: {
          userId: token.userId,
          sessionToken: token.token,
          expires: token.expiresAt,
        },
      });

      return new Token({
        id: result.id,
        userId: result.userId,
        token: result.sessionToken,
        type: token.type,
        expiresAt: result.expires,
        createdAt: new Date(),
      });
    }

    throw new Error(`Unsupported token type: ${token.type}`);
  }

  async findByToken(token: string, type?: TokenType): Promise<Token | null> {
    if (!type || type === TokenType.RESET_PASSWORD || type === TokenType.EMAIL_VERIFICATION) {
      // Шукаємо у VerificationToken
      const verificationToken = await prisma.verificationToken.findFirst({
        where: {
          token,
        },
      });

      if (verificationToken) {
        return new Token({
          id: verificationToken.id,
          userId: verificationToken.identifier,
          token: verificationToken.token,
          type: type || TokenType.EMAIL_VERIFICATION,
          expiresAt: verificationToken.expires,
          createdAt: new Date(),
        });
      }
    }

    if (!type || type === TokenType.JWT_REFRESH) {
      // Шукаємо у Session
      const session = await prisma.session.findFirst({
        where: {
          sessionToken: token,
        },
      });

      if (session) {
        return new Token({
          id: session.id,
          userId: session.userId,
          token: session.sessionToken,
          type: TokenType.JWT_REFRESH,
          expiresAt: session.expires,
          createdAt: new Date(),
        });
      }
    }

    return null;
  }

  async findByUserId(userId: string, type?: TokenType): Promise<Token[]> {
    const tokens: Token[] = [];

    if (!type || type === TokenType.RESET_PASSWORD || type === TokenType.EMAIL_VERIFICATION) {
      // Шукаємо у VerificationToken
      const verificationTokens = await prisma.verificationToken.findMany({
        where: {
          identifier: userId,
        },
      });

      tokens.push(
        ...verificationTokens.map(
          vt =>
            new Token({
              id: vt.id,
              userId: vt.identifier,
              token: vt.token,
              type: type || TokenType.EMAIL_VERIFICATION,
              expiresAt: vt.expires,
              createdAt: new Date(),
            })
        )
      );
    }

    if (!type || type === TokenType.JWT_REFRESH) {
      // Шукаємо у Session
      const sessions = await prisma.session.findMany({
        where: {
          userId,
        },
      });

      tokens.push(
        ...sessions.map(
          s =>
            new Token({
              id: s.id,
              userId: s.userId,
              token: s.sessionToken,
              type: TokenType.JWT_REFRESH,
              expiresAt: s.expires,
              createdAt: new Date(),
            })
        )
      );
    }

    return tokens;
  }

  async delete(id: string): Promise<void> {
    // Спробуємо видалити з VerificationToken
    try {
      await prisma.verificationToken.delete({
        where: { id },
      });
      return;
    } catch (error) {
      // Ігноруємо помилку, це може бути токен в Session
    }

    // Спробуємо видалити з Session
    try {
      await prisma.session.delete({
        where: { id },
      });
    } catch (error) {
      // Ігноруємо помилку, якщо токен не знайдено
      console.error('Error deleting token:', error);
    }
  }

  async deleteByUserId(userId: string, type?: TokenType): Promise<void> {
    if (!type || type === TokenType.RESET_PASSWORD || type === TokenType.EMAIL_VERIFICATION) {
      // Видаляємо з VerificationToken
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: userId,
        },
      });
    }

    if (!type || type === TokenType.JWT_REFRESH) {
      // Видаляємо з Session
      await prisma.session.deleteMany({
        where: {
          userId,
        },
      });
    }
  }

  async deleteExpired(): Promise<void> {
    const now = new Date();

    // Видаляємо прострочені VerificationToken
    await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    // Видаляємо прострочені Session
    await prisma.session.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });
  }
}
