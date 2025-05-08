// src/lib/init-socket-server.ts
import http from 'http';
import https from 'https';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redisClient } from './redis-client';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';

// Глобальні оголошення для типізації
declare global {
  var __httpServer: http.Server;
  var __httpsServer: https.Server;
  var __io: SocketIOServer;
}

// Функція ініціалізації для Next.js
export async function initSocketServer(server: http.Server) {
  // Зберігаємо серверний інстанс для пізнішого використання
  globalThis.__httpServer = server;

  // Якщо Socket.io вже ініціалізовано, повертаємо існуючий інстанс
  if (globalThis.__io) {
    return globalThis.__io;
  }

  try {
    console.log('Initializing Socket.io server...');

    // Створення двох клієнтів Redis для адаптера
    const pubClient = redisClient.duplicateClient();
    const subClient = redisClient.duplicateClient();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    // Створення Socket.io сервера
    const io = new SocketIOServer(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      adapter: createAdapter(pubClient, subClient),
    });

    // Аутентифікація через JWT
    io.use(async (socket: any, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          AuthLogger.warn('Socket connection without token');
          return next(new Error('Authentication error: Token missing'));
        }

        // Перевірка на чорний список
        const isBlacklisted = await redisClient.isBlacklisted(token);
        if (isBlacklisted) {
          AuthLogger.warn('Socket connection with blacklisted token');
          return next(new Error('Authentication error: Token revoked'));
        }

        // Перевірка JWT токена
        const jwtService = new JwtService();
        const payload = await jwtService.verifyAccessToken(token);

        if (!payload || !payload.userId) {
          AuthLogger.warn('Socket connection with invalid token');
          return next(new Error('Authentication error: Invalid token'));
        }

        // Зберігаємо дані користувача в об'єкті сокету
        socket.userId = payload.userId;
        socket.userEmail = payload.email || '';

        // Логуємо успішне підключення
        AuthLogger.info('User authenticated via WebSocket', { userId: payload.userId });

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        AuthLogger.error('Socket authentication error', { error });
        next(new Error('Authentication error'));
      }
    });

    // Обробник підключення (детальна імплементація в socket.ts)
    io.on('connection', socket => {
      console.log(`Socket connected: ${socket.id}`);
    });

    // Зберігаємо інстанс для повторного використання
    globalThis.__io = io;

    console.log('Socket.io server initialized successfully');
    return io;
  } catch (error) {
    console.error('Failed to initialize Socket.io server:', error);
    throw error;
  }
}
