import type { NextAuthOptions } from 'next-auth';

import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { compare } from 'bcryptjs';
import { prisma } from './db';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 днів
  },
  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
    verifyRequest: '/auth/verify-request',
    newUser: '/register',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          AuthLogger.warn('Login attempt with missing credentials');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user) {
            AuthLogger.warn('Login attempt with non-existent email', { email: credentials.email });
            return null;
          }

          // Перевірка чи підтверджено email
          if (!user.emailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
            AuthLogger.warn('Login attempt with unverified email', { email: credentials.email });
            throw new Error('email_not_verified');
          }

          const passwordMatch = await compare(credentials.password, user.password);

          if (!passwordMatch) {
            AuthLogger.warn('Login attempt with incorrect password', { email: credentials.email });
            return null;
          }

          AuthLogger.info('User logged in successfully', { userId: user.id, email: user.email });

          // Генеруємо JWT токени
          const jwtService = new JwtService();
          const { accessToken, refreshToken } = await jwtService.generateTokens(
            user.id,
            user.email
          );

          // Зберігаємо refresh токен в сесії
          await prisma.session.create({
            data: {
              userId: user.id,
              sessionToken: refreshToken,
              expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 днів
            },
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            accessToken,
            refreshToken,
          };
        } catch (error) {
          AuthLogger.error('Error during authorization', { email: credentials.email, error });
          if (error instanceof Error) {
            throw error;
          }
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: any; user: any; account: any }) {
      if (user) {
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      // Перевірка чи потрібно оновити access token
      if (token.accessToken) {
        const jwtService = new JwtService();
        const payload = await jwtService.verifyAccessToken(token.accessToken);

        // Якщо токен скоро закінчується (менше 5 хвилин), оновлюємо його
        if (
          payload &&
          // Використовуємо приведення типу (type assertion) для доступу до властивості exp
          'exp' in payload &&
          typeof payload.exp === 'number' &&
          payload.exp * 1000 - Date.now() < 5 * 60 * 1000
        ) {
          try {
            const authService = ServiceFactory.createAuthService();
            const isValid = await authService.validateRefreshToken(token.id, token.refreshToken);

            if (isValid) {
              const { accessToken, refreshToken } = await jwtService.generateTokens(
                token.id,
                token.email
              );

              // Оновлюємо токени в БД
              await authService.updateRefreshToken(token.id, token.refreshToken, refreshToken);

              token.accessToken = accessToken;
              token.refreshToken = refreshToken;
            }
          } catch (error) {
            AuthLogger.error('Error refreshing token', { userId: token.id, error });
          }
        }
      }

      return token;
    },
    async session({ token, session }: { token: any; session: any }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.accessToken = token.accessToken;
      }

      return session;
    },
  },
  events: {
    async signOut({ token }) {
      try {
        if (token?.id && token?.refreshToken) {
          const authService = ServiceFactory.createAuthService();
          await authService.logout(token.id, token.refreshToken);
          AuthLogger.info('User logged out successfully', { userId: token.id });
        }
      } catch (error) {
        AuthLogger.error('Error during sign out', { error });
      }
    },
  },
  debug: process.env.NODE_ENV === 'development',
};

export const nextAuthConfig = authOptions;
