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
    io.use(async (socket: AuthenticatedSocket, next) => {
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

    // Налаштування обробників подій
    io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId;
      console.log(`User connected: ${userId}`);

      // Отримуємо список чатів користувача
      const chatService = ServiceFactory.createChatService();
      const userChats = await chatService.getUserChats(userId);
      const chatIds = userChats.map(chat => chat.id);

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

      // Редагування повідомлення
      socket.on('edit-message', async data => {
        try {
          const { messageId, content } = data;

          // Використовуємо сервіс повідомлень для редагування
          const messageService = ServiceFactory.createMessageService();
          const message = await messageService.editMessage(messageId, userId, content);

          if (message) {
            // Трансляція оновленого повідомлення
            io.to(`chat:${message.chatId}`).emit('message-updated', message);
          }
        } catch (error) {
          console.error('Error editing message:', error);
          socket.emit('error', {
            type: 'edit-message-error',
            message: 'Failed to edit message',
          });
        }
      });

      // Видалення повідомлення
      socket.on('delete-message', async data => {
        try {
          const { messageId } = data;

          // Використовуємо сервіс повідомлень для видалення
          const messageService = ServiceFactory.createMessageService();

          // Отримуємо повідомлення щоб знати chatId
          const message = await messageService.getMessageById(messageId, userId);

          if (!message) {
            socket.emit('error', {
              type: 'message-not-found',
              message: 'Message not found',
            });
            return;
          }

          const success = await messageService.deleteMessage(messageId, userId);

          if (success) {
            // Трансляція події видалення
            io.to(`chat:${message.chatId}`).emit('message-deleted', {
              messageId,
              chatId: message.chatId,
              deletedBy: userId,
              timestamp: new Date().toISOString(),
            });
          }
        } catch (error) {
          console.error('Error deleting message:', error);
          socket.emit('error', {
            type: 'delete-message-error',
            message: 'Failed to delete message',
          });
        }
      });

      // Набір тексту
      socket.on('typing', async data => {
        try {
          const { chatId, isTyping } = data;

          // Зберігаємо статус набору в Redis
          await redisClient.setUserTyping(chatId, userId, isTyping);

          // Отримуємо ім'я користувача з авторизаційних даних
          const userName = socket.handshake.auth.userName || '';

          // Трансляція інформації про набір тексту всім учасникам чату, крім відправника
          socket.to(`chat:${chatId}`).emit('user-typing', {
            userId,
            userName,
            chatId,
            isTyping,
          });
        } catch (error) {
          console.error('Error updating typing status:', error);
        }
      });

      // Прочитання повідомлення
      socket.on('read-message', async data => {
        try {
          const { messageId, chatId } = data;

          // Використовуємо сервіс повідомлень для позначення прочитаним
          const messageService = ServiceFactory.createMessageService();
          await messageService.markAllAsRead(chatId, userId);

          // Трансляція події прочитання
          io.to(`chat:${chatId}`).emit('message-read', {
            chatId,
            userId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error marking message as read:', error);
        }
      });

      // Зміна статусу користувача
      socket.on('change-status', async data => {
        try {
          const { status } = data;

          // Оновлюємо статус у базі даних
          const userService = ServiceFactory.createUserService();
          await userService.updateUserStatus(userId, status);

          // Оновлюємо статус в Redis
          await redisClient.setUserStatus(userId, status);

          // Сповіщаємо про зміну статусу
          socket.broadcast.emit('user-status-changed', {
            userId,
            status,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Error changing user status:', error);
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
