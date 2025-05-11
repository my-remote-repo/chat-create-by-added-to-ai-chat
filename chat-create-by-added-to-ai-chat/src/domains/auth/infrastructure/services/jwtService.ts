// src/domains/auth/infrastructure/services/jwtService.ts
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { JWT_ACCESS_TOKEN_EXPIRY, JWT_REFRESH_TOKEN_EXPIRY } from '@/shared/constants';

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
    const jti = uuidv4();
    const iat = Math.floor(Date.now() / 1000);

    // Генерація access токена з використанням констант
    const accessToken = await new SignJWT({ userId, email, role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_ACCESS_TOKEN_EXPIRY)
      .setIssuedAt()
      .setJti(jti)
      .sign(this.accessTokenSecret);

    // Генерація refresh токена з використанням констант
    const refreshToken = await new SignJWT({ userId, jti })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(JWT_REFRESH_TOKEN_EXPIRY)
      .setIssuedAt()
      .sign(this.refreshTokenSecret);

    return { accessToken, refreshToken };
  }

  /**
   * Перевіряє access token
   */
  async verifyAccessToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      // console.log('JwtService: Verifying token...');
      const { payload } = await jwtVerify(token, this.accessTokenSecret);

      // console.log('JwtService: Verification result:', payload);

      if (!payload || typeof payload.userId !== 'string') {
        console.error('JwtService: Invalid payload:', payload);
        return null;
      }

      return {
        userId: payload.userId as string,
        email: payload.email as string | undefined,
        role: payload.role as string | undefined,
      };
    } catch (error) {
      console.error('JwtService: Verification failed:', error);
      return null;
    }
  }

  /**
   * Перевіряє refresh token
   */
  async verifyRefreshToken(token: string): Promise<CustomJWTPayload | null> {
    try {
      console.log('Verifying refresh token...');
      if (!token || token === 'undefined') {
        console.error('Invalid token format:', token);
        return null;
      }

      const { payload } = await jwtVerify(token, this.refreshTokenSecret);

      // Перевіряємо, чи є в payload необхідні поля
      if (!payload || typeof payload.userId !== 'string') {
        console.error('Invalid payload format:', payload);
        return null;
      }

      console.log('Token verified successfully');
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
