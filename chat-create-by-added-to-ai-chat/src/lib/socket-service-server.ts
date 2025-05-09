// src/lib/socket-service-server.ts
import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { redisClient } from './redis-client';
import { Chat, ChatDTO } from '@/domains/chat/domain/entities/chat';

// Розширення інтерфейсу Socket для типізації даних користувача
interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    userEmail: string;
    userName?: string;
  };
}

export function configureSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware для аутентифікації
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        console.warn('Socket connection without token');
        return next(new Error('Authentication error: Token missing'));
      }

      // Перевірка на чорний список
      const isBlacklisted = await redisClient.isBlacklisted(token);
      if (isBlacklisted) {
        console.warn('Socket connection with blacklisted token');
        return next(new Error('Authentication error: Token revoked'));
      }

      // Перевірка JWT токена
      const jwtService = new JwtService();
      const payload = await jwtService.verifyAccessToken(token);

      if (!payload || !payload.userId) {
        console.warn('Socket connection with invalid token');
        return next(new Error('Authentication error: Invalid token'));
      }

      // Зберігаємо дані користувача в об'єкті сокета
      const authSocket = socket as AuthenticatedSocket;
      authSocket.data.userId = payload.userId;
      authSocket.data.userEmail = payload.email || '';
      authSocket.data.userName = socket.handshake.auth.userName || '';

      console.log('User authenticated via WebSocket', { userId: payload.userId });
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Обробка підключення
  io.on('connection', (socket: Socket) => {
    const authSocket = socket as AuthenticatedSocket;
    const userId = authSocket.data.userId;
    const userName = authSocket.data.userName || 'Користувач';

    console.log(`User connected: ${userId}, Name: ${userName}`);

    // Оновлюємо статус користувача на онлайн
    redisClient
      .setUserStatus(userId, 'online')
      .catch(err => console.error('Error setting user status:', err));

    // Сповіщаємо інших про підключення
    socket.broadcast.emit('user-status-changed', {
      userId,
      status: 'online',
      timestamp: new Date().toISOString(),
    });

    // Отримуємо список чатів користувача
    const getChatIds = async () => {
      try {
        const chatService = ServiceFactory.createChatService();
        const userChats = await chatService.getUserChats(userId);

        // Приєднуємось до кімнат для всіх чатів користувача
        for (const chat of userChats) {
          socket.join(`chat:${chat.id}`);
          console.log(`User ${userId} auto-joined chat: ${chat.id}`);
        }

        // Виправлена типізація - використовуємо структурну типізацію
        return userChats.map((chat: { id: string }) => chat.id);
      } catch (error) {
        console.error('Error getting user chats:', error);
        return [];
      }
    };

    // Автоматично приєднуємось до чатів користувача
    getChatIds().catch(err => console.error('Error auto-joining chats:', err));

    // Обробник приєднання до чату
    socket.on('join-chat', async (chatId: string) => {
      try {
        console.log(`User ${userId} requesting to join chat: ${chatId}`);

        // Перевіряємо, чи користувач має доступ до чату
        const chatService = ServiceFactory.createChatService();
        const chat: Chat | null = await chatService.getChatById(chatId, userId); // Явно вказуємо тип

        if (chat) {
          socket.join(`chat:${chatId}`);
          console.log(`User ${userId} joined chat: ${chatId}`);

          // Додаємо користувача до списку активних користувачів чату
          await redisClient.addUserToChat(chatId, userId);

          // Сповіщаємо інших про приєднання
          socket.to(`chat:${chatId}`).emit('user-joined-chat', {
            userId,
            userName,
            chatId,
            timestamp: new Date().toISOString(),
          });
        } else {
          console.warn(`User ${userId} denied access to chat ${chatId}`);
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

    // Обробник відправки повідомлення
    socket.on(
      'send-message',
      async (data: {
        tempId?: string;
        chatId: string;
        content: string;
        replyToId?: string;
        files?: Array<{
          name: string;
          url: string;
          size: number;
          type: string;
        }>;
      }) => {
        try {
          console.log(
            `New message from ${userId} in chat ${data.chatId}:`,
            data.content.substring(0, 50)
          );

          // Використовуємо MessageService для збереження повідомлення
          const messageService = ServiceFactory.createMessageService();
          const message = await messageService.createMessage(
            data.chatId,
            userId,
            data.content,
            data.replyToId,
            data.files
          );

          if (message) {
            // Додаємо дані користувача до повідомлення
            const enrichedMessage = {
              ...message,
              tempId: data.tempId,
              user: {
                id: userId,
                name: userName,
                image: socket.handshake.auth.userImage || null,
              },
            };

            // Транслюємо повідомлення всім учасникам чату
            io.to(`chat:${data.chatId}`).emit('new-message', enrichedMessage);

            // Надсилаємо підтвердження відправнику
            if (data.tempId) {
              socket.emit('message-status-updated', {
                messageId: data.tempId,
                status: 'sent',
                actualId: message.id,
              });
            }

            // Оновлюємо активність чату
            const chatService = ServiceFactory.createChatService();
            await chatService.updateLastActivity(data.chatId);

            console.log(`Message saved to database with ID: ${message.id}`);
          } else {
            console.error('Failed to create message - service returned null');
            if (data.tempId) {
              socket.emit('message-status-updated', {
                messageId: data.tempId,
                status: 'error',
                error: 'Failed to save message',
              });
            }
          }
        } catch (error) {
          console.error('Error sending message:', error);
          if (data.tempId) {
            socket.emit('message-status-updated', {
              messageId: data.tempId,
              status: 'error',
              error: 'Server error',
            });
          }
        }
      }
    );

    // Обробник набору тексту
    socket.on('typing', async (data: { chatId: string; isTyping: boolean }) => {
      try {
        // Перевіряємо, чи користувач має доступ до чату
        const chatService = ServiceFactory.createChatService();
        const chat = await chatService.getChatById(data.chatId, userId);

        if (chat) {
          // Оновлюємо статус набору тексту в Redis
          await redisClient.setUserTyping(data.chatId, userId, data.isTyping);

          // Сповіщаємо інших учасників чату
          socket.to(`chat:${data.chatId}`).emit('user-typing', {
            userId,
            userName,
            chatId: data.chatId,
            isTyping: data.isTyping,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error handling typing status:', error);
      }
    });

    // Обробник прочитання повідомлень
    socket.on('read-message', async (data: { chatId: string; messageId?: string }) => {
      try {
        // Перевіряємо, чи користувач має доступ до чату
        const chatService = ServiceFactory.createChatService();
        const chat = await chatService.getChatById(data.chatId, userId);

        if (chat) {
          const messageService = ServiceFactory.createMessageService();

          if (data.messageId) {
            // Позначаємо конкретне повідомлення як прочитане
            await messageService.markAsRead(data.messageId, userId);
          } else {
            // Позначаємо всі повідомлення в чаті як прочитані
            await messageService.markAllAsRead(data.chatId, userId);
          }

          // Сповіщаємо інших учасників чату
          io.to(`chat:${data.chatId}`).emit('messages-read', {
            userId,
            chatId: data.chatId,
            messageId: data.messageId, // може бути undefined
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Обробник зміни статусу користувача
    socket.on('change-status', async (data: { status: string }) => {
      try {
        const status = data.status.toLowerCase();

        if (['online', 'offline', 'away', 'busy'].includes(status)) {
          await redisClient.setUserStatus(userId, status as 'online' | 'offline' | 'away' | 'busy');

          // Сповіщаємо всіх про зміну статусу
          io.emit('user-status-changed', {
            userId,
            status,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error changing user status:', error);
      }
    });

    // Для тестування з'єднання
    socket.on('ping', (data, callback) => {
      console.log(`Ping from ${userId}:`, data);
      if (typeof callback === 'function') {
        callback({
          pong: true,
          time: Date.now(),
          serverTime: new Date().toISOString(),
        });
      } else {
        socket.emit('pong', {
          time: Date.now(),
          serverTime: new Date().toISOString(),
        });
      }
    });

    // Обробник відключення
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${userId}`);

      try {
        // Оновлюємо статус користувача
        await redisClient.setUserStatus(userId, 'offline');

        // Отримуємо список чатів і видаляємо користувача з активних чатів
        const chatIds = await getChatIds();
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

  return io;
}
