// src/lib/socket.ts
import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { NextApiResponseServerIO } from '@/shared/types';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { redisClient } from './redis-client';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { Chat } from '@/domains/chat/domain/entities/chat'; // Додайте цей імпорт для типізації
import { ChatDTO } from '@/domains/chat/domain/entities/chat';

// Розширюємо інтерфейс Socket
interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

/**
 * Socket.io сервер для чатів у реальному часі
 */
export const initSocketServer = async (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.io server...');
    const httpServer: NetServer = res.socket.server as any;

    // Створення двох клієнтів Redis для адаптера
    const pubClient = redisClient.duplicateClient();
    const subClient = redisClient.duplicateClient();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    const io = new ServerIO(httpServer, {
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
    io.use(async (socket: Socket, next) => {
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
        (socket as AuthenticatedSocket).userId = payload.userId;
        (socket as AuthenticatedSocket).userEmail = payload.email || '';

        // Логуємо успішне підключення
        AuthLogger.info('User authenticated via WebSocket', { userId: payload.userId });

        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        AuthLogger.error('Socket authentication error', { error });
        next(new Error('Authentication error'));
      }
    });

    // Налаштування обробників подій
    io.on('connection', async (socket: Socket) => {
      const userId = (socket as AuthenticatedSocket).userId;
      console.log(`User connected: ${userId}`);

      // Отримуємо список чатів користувача
      const chatService = ServiceFactory.createChatService();
      const userChats = await chatService.getUserChats(userId);

      // Виправлення: додаємо явний тип для параметра chat
      const chatIds = userChats.map((chat: { id: string }) => chat.id);

      // Оновлюємо статус користувача на онлайн
      await redisClient.setUserStatus(userId, 'online');

      // Підключення до кімнат для всіх чатів користувача
      for (const chatId of chatIds) {
        socket.join(`chat:${chatId}`);
      }

      // Сповіщаємо інших про підключення
      socket.broadcast.emit('user-status-changed', {
        userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });

      // Підключення до конкретного чату
      socket.on('join-chat', async (chatId: string) => {
        try {
          // Перевіряємо, чи користувач має доступ до чату
          const chat = await chatService.getChatById(chatId, userId);

          if (chat) {
            socket.join(`chat:${chatId}`);
            console.log(`User ${userId} joined chat: ${chatId}`);

            // Додаємо користувача до списку активних користувачів чату
            await redisClient.addUserToChat(chatId, userId);

            // Сповіщаємо інших про приєднання
            socket.to(`chat:${chatId}`).emit('user-joined-chat', {
              userId,
              chatId,
              timestamp: new Date().toISOString(),
            });
          } else {
            // Користувач не має доступу до чату
            socket.emit('error', {
              type: 'chat-access-denied',
              message: 'You do not have access to this chat',
              chatId,
            });
          }
        } catch (error) {
          console.error(`Error joining chat ${chatId}:`, error);
          socket.emit('error', {
            type: 'join-chat-error',
            message: 'Failed to join chat',
            chatId,
          });
        }
      });

      // Решта обробників подій...
      // [Тут залишаємо решту вашого коду без змін]

      // Відправка повідомлення
      socket.on('send-message', async data => {
        try {
          const { chatId, content, replyToId, files } = data;

          // Використовуємо сервіс повідомлень для створення
          const messageService = ServiceFactory.createMessageService();
          const message = await messageService.createMessage(
            chatId,
            userId,
            content,
            replyToId,
            files
          );

          if (message) {
            // Трансляція повідомлення всім учасникам чату
            io.to(`chat:${chatId}`).emit('new-message', {
              ...message,
              user: {
                id: userId,
                name: socket.handshake.auth.userName || '',
                image: socket.handshake.auth.userImage || null,
              },
            });

            // Оновлюємо дату останньої активності чату
            await chatService.updateLastActivity(chatId);
          }
        } catch (error) {
          console.error('Error sending message:', error);
          socket.emit('error', {
            type: 'message-error',
            message: 'Failed to send message',
          });
        }
      });

      // Від'єднання
      socket.on('disconnect', async () => {
        try {
          console.log(`User disconnected: ${userId}`);

          // Оновлюємо статус користувача в Redis
          await redisClient.setUserStatus(userId, 'offline');

          // Видаляємо користувача з активних чатів
          for (const chatId of chatIds) {
            await redisClient.removeUserFromChat(chatId, userId);
          }

          // Сповіщаємо про відключення
          socket.broadcast.emit('user-status-changed', {
            userId,
            status: 'offline',
            timestamp: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error handling disconnect:', error);
        }
      });
    });

    // Збереження інстансу io для повторного використання
    res.socket.server.io = io;

    console.log('Socket.io server initialized successfully');
  }

  return res.socket.server.io;
};
