// src/lib/socket-service.ts
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer, Server as HTTPServer } from 'http';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { AuthLogger } from '@/domains/auth/infrastructure/services/authLogger';
import { redisClient } from './redis-client';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';

// Інтерфейс для аутентифікованого сокету
interface AuthenticatedSocket extends Socket {
  userId: string;
  userEmail: string;
}

// Змінні для зберігання інстансів сервера і Socket.io
let httpServer: HTTPServer | undefined;
let io: SocketIOServer<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> | undefined;
/**
 * Ініціалізує Socket.io сервер, якщо він ще не запущений
 */
export function startSocketServer(): SocketIOServer | null {
  // Перевіряємо, чи ми на стороні сервера
  if (typeof window !== 'undefined') {
    console.warn('startSocketServer called on client side!');
    return null;
  }

  if (io) {
    return io;
  }

  try {
    console.log('Starting Socket.io server...');

    // Створюємо HTTP сервер
    httpServer = createServer();

    // Створюємо Socket.io сервер
    io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // В розробці дозволяємо всі джерела
        methods: ['GET', 'POST'],
        credentials: true,
      },
      // Додайте adapter для Redis, якщо потрібно
      // adapter: createAdapter(pubClient, subClient),
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
      try {
        const chatService = ServiceFactory.createChatService();
        const userChats = await chatService.getUserChats(userId);

        // Фіксуємо типізацію для chat
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

        // Відправка повідомлення
        socket.on(
          'send-message',
          async (data: {
            chatId: string;
            content: string;
            replyToId?: string;
            files?: Array<{
              name: string;
              url: string;
              size: number;
              type: string;
            }>;
            tempId?: string;
          }) => {
            try {
              const { chatId, content, replyToId, files, tempId } = data;

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
                // Додаємо tempId для відстеження оптимістичних UI оновлень
                const messageWithTemp = {
                  ...message,
                  tempId,
                  user: {
                    id: userId,
                    name: socket.handshake.auth.userName || '',
                    image: socket.handshake.auth.userImage || null,
                  },
                };

                // Трансляція повідомлення всім учасникам чату
                if (io) {
                  io.to(`chat:${chatId}`).emit('new-message', messageWithTemp);
                }

                // Оновлюємо дату останньої активності чату
                await chatService.updateLastActivity(chatId);
              } else if (tempId) {
                // Сповіщення про помилку для оптимістичного UI
                socket.emit('message-status-updated', {
                  messageId: tempId,
                  status: 'error',
                });
              }
            } catch (error) {
              console.error('Error sending message:', error);
              socket.emit('error', {
                type: 'message-error',
                message: 'Failed to send message',
              });
            }
          }
        );

        // Статус набору тексту
        socket.on('typing', async (data: { chatId: string; isTyping: boolean }) => {
          try {
            const { chatId, isTyping } = data;

            // Перевіряємо, чи користувач має доступ до чату
            const chat = await chatService.getChatById(chatId, userId);

            if (chat) {
              // Оновлюємо статус набору тексту в Redis
              await redisClient.setUserTyping(chatId, userId, isTyping);

              // Сповіщаємо інших учасників чату
              socket.to(`chat:${chatId}`).emit('user-typing', {
                userId,
                chatId,
                userName: socket.handshake.auth.userName || '',
                isTyping,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error handling typing status:', error);
          }
        });

        // Позначення повідомлень як прочитаних
        socket.on('read-message', async (data: { chatId: string }) => {
          try {
            const { chatId } = data;

            // Перевіряємо, чи користувач має доступ до чату
            const chat = await chatService.getChatById(chatId, userId);

            if (chat) {
              // Перевіряємо, чи є непрочитані повідомлення, перед оновленням
              const messageService = ServiceFactory.createMessageService();
              const unreadCount = await messageService.getUnreadCount(chatId, userId);

              // Оновлюємо тільки якщо є непрочитані повідомлення
              if (unreadCount > 0) {
                await messageService.markAllAsRead(chatId, userId);

                // Сповіщаємо інших учасників чату
                socket.to(`chat:${chatId}`).emit('messages-read', {
                  userId,
                  chatId,
                  timestamp: new Date().toISOString(),
                });
              }
            }
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        });

        // Зміна статусу користувача
        socket.on('change-status', async (data: { status: string }) => {
          try {
            const { status } = data;
            const normalizedStatus = status.toLowerCase();

            if (['online', 'offline', 'away', 'busy'].includes(normalizedStatus)) {
              await redisClient.setUserStatus(
                userId,
                normalizedStatus as 'online' | 'offline' | 'away' | 'busy'
              );

              // Сповіщаємо всіх про зміну статусу
              if (io) {
                io.emit('user-status-changed', {
                  userId,
                  status: normalizedStatus,
                  timestamp: new Date().toISOString(),
                });
              }
            }
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
      } catch (error) {
        console.error('Error setting up socket connection:', error);
      }
    });

    // Запускаємо HTTP сервер на порту 3001
    if (httpServer) {
      httpServer.listen(3001, () => {
        console.log('Socket.io server is running on port 3001');
      });
    }

    return io;
  } catch (error) {
    console.error('Failed to start Socket.io server:', error);
    return null;
  }
}

/**
 * Повертає інстанс Socket.io сервера, якщо він існує
 */
export function getIOInstance(): SocketIOServer | undefined {
  return io;
}

// Автоматично запускаємо сервер при імпорті модуля на стороні сервера
if (typeof window === 'undefined') {
  startSocketServer();
}

// Експортуємо io для використання в інших модулях
export { io };
