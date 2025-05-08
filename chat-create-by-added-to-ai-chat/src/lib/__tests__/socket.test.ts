// src/lib/__tests__/socket.test.ts
import { Server } from 'http';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { Server as SocketIOServer } from 'socket.io';
import { JwtService } from '@/domains/auth/infrastructure/services/jwtService';
import { MockRedisService } from '@/lib/mock-redis-client';
import { describe, it, beforeAll, afterAll, jest, expect } from '@jest/globals';

// Типи для повернених значень
interface ChatItem {
  id: string;
  name: string;
}

interface ChatDetails {
  id: string;
  name: string;
  participants: { userId: string }[];
}

interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

// Інтерфейси для параметрів подій
interface SendMessageData {
  chatId: string;
  content: string;
}

interface TypingData {
  chatId: string;
  isTyping: boolean;
}

interface ReadMessageData {
  chatId: string;
}

// Інтерфейси для сервісів
interface ChatService {
  getUserChats: (userId: string) => Promise<ChatItem[]>;
  getChatById: (chatId: string, userId: string) => Promise<ChatDetails | null>;
  updateLastActivity: (chatId: string) => Promise<boolean>;
}

interface MessageService {
  createMessage: (chatId: string, userId: string, content: string) => Promise<Message>;
  markAllAsRead: (chatId: string, userId: string) => Promise<boolean>;
}

// Розширення інтерфейсу для MockRedisService
interface ExtendedMockRedisService extends MockRedisService {
  isBlacklisted: (token: string) => Promise<boolean>;
  addUserToChat: (chatId: string, userId: string) => Promise<void>;
  removeUserFromChat: (chatId: string, userId: string) => Promise<void>;
}

describe('Socket.io Server', () => {
  let server: Server;
  let io: SocketIOServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  let port: number;
  let mockRedis: ExtendedMockRedisService;
  let mockJwtService: JwtService;
  let mockToken: string;
  let mockChatService: ChatService;
  let mockMessageService: MessageService;

  beforeAll(done => {
    // Створення HTTP сервера
    server = new Server();

    // Визначення випадкового порту для тестів
    port = 3031;

    // Мокування Redis
    mockRedis = new MockRedisService() as ExtendedMockRedisService;
    jest.spyOn(mockRedis, 'setUserStatus').mockResolvedValue();
    jest.spyOn(mockRedis, 'getUserStatus').mockResolvedValue('online');
    jest.spyOn(mockRedis, 'isBlacklisted').mockResolvedValue(false);
    jest.spyOn(mockRedis, 'addUserToChat').mockResolvedValue();
    jest.spyOn(mockRedis, 'removeUserFromChat').mockResolvedValue();

    // Мокування JWT сервісу
    mockJwtService = new JwtService();
    mockToken = 'mock-token';
    jest.spyOn(mockJwtService, 'verifyAccessToken').mockResolvedValue({
      userId: 'test-user-1',
      email: 'test1@example.com',
    });

    // Створення функцій моків
    const getUserChats = (userId: string): Promise<ChatItem[]> => {
      return Promise.resolve([
        { id: 'chat-1', name: 'Test Chat 1' },
        { id: 'chat-2', name: 'Test Chat 2' },
      ]);
    };

    const getChatById = (chatId: string, userId: string): Promise<ChatDetails | null> => {
      if (chatId === 'chat-1' || chatId === 'chat-2') {
        return Promise.resolve({
          id: chatId,
          name: `Test Chat ${chatId.split('-')[1]}`,
          participants: [{ userId: 'test-user-1' }, { userId: 'test-user-2' }],
        });
      }
      return Promise.resolve(null);
    };

    const updateLastActivity = (chatId: string): Promise<boolean> => {
      return Promise.resolve(true);
    };

    const createMessage = (chatId: string, userId: string, content: string): Promise<Message> => {
      return Promise.resolve({
        id: `msg-${Date.now()}`,
        chatId,
        userId,
        content,
        createdAt: new Date(),
      });
    };

    const markAllAsRead = (chatId: string, userId: string): Promise<boolean> => {
      return Promise.resolve(true);
    };

    // Створення моків з правильними типами
    mockChatService = {
      getUserChats: jest.fn(getUserChats),
      getChatById: jest.fn(getChatById),
      updateLastActivity: jest.fn(updateLastActivity),
    };

    mockMessageService = {
      createMessage: jest.fn(createMessage),
      markAllAsRead: jest.fn(markAllAsRead),
    };

    // Мокування фабрики сервісів
    jest.mock('@/shared/infrastructure/DependencyInjection', () => ({
      ServiceFactory: {
        createChatService: jest.fn().mockReturnValue(mockChatService),
        createMessageService: jest.fn().mockReturnValue(mockMessageService),
      },
    }));

    // Налаштування Socket.io сервера
    io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Аутентифікаційний middleware
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication error: Token missing'));
        }

        // Перевірка на чорний список
        const isBlacklisted = await mockRedis.isBlacklisted(token);
        if (isBlacklisted) {
          return next(new Error('Authentication error: Token revoked'));
        }

        // Перевірка JWT токена
        const payload = await mockJwtService.verifyAccessToken(token);

        if (!payload || !payload.userId) {
          return next(new Error('Authentication error: Invalid token'));
        }

        // Зберігаємо дані користувача в об'єкті сокету
        (socket as any).userId = payload.userId;
        (socket as any).userEmail = payload.email || '';

        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    // Обробник підключення
    io.on('connection', async (socket: any) => {
      const userId = socket.userId;

      // Оновлюємо статус користувача на онлайн
      await mockRedis.setUserStatus(userId, 'online');

      // Підключення до чатів
      socket.join(`chat:chat-1`);
      socket.join(`chat:chat-2`);

      // Сповіщаємо інших про підключення
      socket.broadcast.emit('user-status-changed', {
        userId,
        status: 'online',
        timestamp: new Date().toISOString(),
      });

      // Відправка повідомлення
      socket.on('send-message', async (data: SendMessageData) => {
        try {
          const { chatId, content } = data;

          // Створення повідомлення
          const message = await mockMessageService.createMessage(chatId, userId, content);

          // Трансляція повідомлення
          io.to(`chat:${chatId}`).emit('new-message', message);

          // Оновлення активності чату
          await mockChatService.updateLastActivity(chatId);
        } catch (error) {
          socket.emit('error', {
            type: 'message-error',
            message: 'Failed to send message',
          });
        }
      });

      // Набір тексту
      socket.on('typing', async (data: TypingData) => {
        try {
          const { chatId, isTyping } = data;

          // Трансляція статусу набору
          socket.to(`chat:${chatId}`).emit('user-typing', {
            userId,
            userName: socket.handshake.auth.userName || '',
            chatId,
            isTyping,
          });
        } catch (error) {
          // Логування помилки
        }
      });

      // Прочитання повідомлень
      socket.on('read-message', async (data: ReadMessageData) => {
        try {
          const { chatId } = data;

          // Позначення прочитаними
          await mockMessageService.markAllAsRead(chatId, userId);

          // Трансляція події прочитання
          io.to(`chat:${chatId}`).emit('message-read', {
            chatId,
            userId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          // Логування помилки
        }
      });

      // Відключення
      socket.on('disconnect', async () => {
        // Оновлюємо статус користувача
        await mockRedis.setUserStatus(userId, 'offline');

        // Сповіщаємо про відключення
        socket.broadcast.emit('user-status-changed', {
          userId,
          status: 'offline',
          timestamp: new Date().toISOString(),
        });
      });
    });

    server.listen(port, () => {
      // Клієнт 1 (аутентифікований)
      clientSocket1 = ioc(`http://localhost:${port}`, {
        auth: {
          token: mockToken,
          userId: 'test-user-1',
          userName: 'Test User 1',
        },
        autoConnect: false,
      });

      // Клієнт 2 (аутентифікований)
      clientSocket2 = ioc(`http://localhost:${port}`, {
        auth: {
          token: mockToken,
          userId: 'test-user-2',
          userName: 'Test User 2',
        },
        autoConnect: false,
      });

      done();
    });
  });

  afterAll(() => {
    // Закриття з'єднань
    io.close();
    clientSocket1.close();
    clientSocket2.close();
    server.close();
  });

  it('should connect and authenticate successfully', done => {
    clientSocket1.connect();

    clientSocket1.on('connect', () => {
      expect(clientSocket1.connected).toBe(true);
      done();
    });

    clientSocket1.on('connect_error', err => {
      done(new Error(`Connection error: ${err.message}`));
    });
  });

  it('should receive status updates from other users', done => {
    clientSocket1.connect();

    clientSocket1.on('connect', () => {
      // Підключаємо другий клієнт
      clientSocket2.connect();

      clientSocket1.on('user-status-changed', data => {
        expect(data.userId).toBe('test-user-2');
        expect(data.status).toBe('online');
        done();
      });
    });
  });

  it('should send and receive messages', done => {
    clientSocket1.connect();
    clientSocket2.connect();

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        // Другий клієнт підписується на нові повідомлення
        clientSocket2.on('new-message', message => {
          expect(message.chatId).toBe('chat-1');
          expect(message.userId).toBe('test-user-1');
          expect(message.content).toBe('Hello, this is a test message');
          done();
        });

        // Перший клієнт відправляє повідомлення
        clientSocket1.emit('send-message', {
          chatId: 'chat-1',
          content: 'Hello, this is a test message',
        });
      });
    });
  });

  it('should broadcast typing status', done => {
    clientSocket1.connect();
    clientSocket2.connect();

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        // Другий клієнт підписується на події набору
        clientSocket2.on('user-typing', data => {
          expect(data.chatId).toBe('chat-1');
          expect(data.userId).toBe('test-user-1');
          expect(data.isTyping).toBe(true);
          done();
        });

        // Перший клієнт відправляє статус набору
        clientSocket1.emit('typing', {
          chatId: 'chat-1',
          isTyping: true,
        });
      });
    });
  });

  it('should broadcast read receipts', done => {
    clientSocket1.connect();
    clientSocket2.connect();

    clientSocket1.on('connect', () => {
      clientSocket2.on('connect', () => {
        // Другий клієнт підписується на події прочитання
        clientSocket2.on('message-read', data => {
          expect(data.chatId).toBe('chat-1');
          expect(data.userId).toBe('test-user-1');
          done();
        });

        // Перший клієнт відправляє статус прочитання
        clientSocket1.emit('read-message', {
          chatId: 'chat-1',
        });
      });
    });
  });
});
