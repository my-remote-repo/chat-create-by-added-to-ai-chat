// src/domains/auth/infrastructure/services/jwtService.ts
import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'crypto';

// Розширюємо інтерфейс JWTPayload з jose
interface CustomJWTPayload {
  userId: string;
  email?: string;
  role?: string;
}

export class JwtService {
  private readonly accessTokenSecret: Uint8Array;
  private readonly refreshTokenSecret: Uint8Array;

  constructor() {
    // Перетворення рядків-секретів у Uint8Array для jose
    this.accessTokenSecret = new TextEncoder().encode(
      process.env.JWT_ACCESS_SECRET || 'default-access-secret-key-change-in-production'
    );
    this.refreshTokenSecret = new TextEncoder().encode(
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-key-change-in-production'
    );
  }

  /**
   * Генерує пару токенів (access + refresh)
   */
  async generateTokens(
    userId: string,
    email?: string,
    role?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jti = randomUUID();
    const iat = Math.floor(Date.now() / 1000);

    // Генерація access токена (коротка тривалість - 15 хвилин)
    const accessToken = await new SignJWT({ userId, email, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('15m')
      .setIssuedAt()
      .setJti(jti)
      .sign(this.accessTokenSecret);

    // Генерація refresh токена (довга тривалість - 30 днів)
    const refreshToken = await new SignJWT({ userId, jti })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .setIssuedAt()
      .sign(this.refreshTokenSecret);

    return { accessToken, refreshToken };
  }

  /**
   * Перевіряє access token
   */
  async verifyAccessToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.accessTokenSecret);

      // Перевіряємо, чи є в payload необхідні поля
      if (!payload || typeof payload.userId !== 'string') {
        return null;
      }

      return {
        userId: payload.userId as string,
        email: payload.email as string | undefined,
        role: payload.role as string | undefined,
      };
    } catch (error) {
      console.error('Access token verification failed:', error);
      return null;
    }
  }

  /**
   * Перевіряє refresh token
   */
  async verifyRefreshToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.refreshTokenSecret);

      // Перевіряємо, чи є в payload необхідні поля
      if (!payload || typeof payload.userId !== 'string') {
        return null;
      }

      return {
        userId: payload.userId as string,
        email: payload.email as string | undefined,
        role: payload.role as string | undefined,
      };
    } catch (error) {
      console.error('Refresh token verification failed:', error);
      return null;
    }
  }
}
