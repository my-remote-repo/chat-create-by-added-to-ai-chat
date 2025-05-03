import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/shared/types';

/**
 * Socket.io сервер для чатів у реальному часі
 */
export const initSocketServer = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    // Аутентифікація через JWT
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: Token missing'));
        }
        
        // Тут має бути перевірка і розшифрування token
        // В реальному додатку використайте JWT або NextAuth
        const user = { id: 'userId', name: 'User Name' }; // Заглушка
        
        // Зберігаємо дані користувача в об'єкті сокету
        socket.data.user = user;
        
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error'));
      }
    });

    // Налаштування обробників подій
    io.on('connection', (socket) => {
      console.log(`User connected: ${socket.data.user?.id || 'unknown'}`);
      
      // Підключення до кімнат для всіх чатів користувача
      socket.on('join-chats', (chatIds: string[]) => {
        chatIds.forEach(chatId => {
          socket.join(`chat:${chatId}`);
        });
        console.log(`User ${socket.data.user?.id} joined chats:`, chatIds);
      });
      
      // Підключення до конкретного чату
      socket.on('join-chat', (chatId: string) => {
        socket.join(`chat:${chatId}`);
        console.log(`User ${socket.data.user?.id} joined chat: ${chatId}`);
      });
      
      // Відправка повідомлення
      socket.on('send-message', (data) => {
        // Трансляція повідомлення всім учасникам чату
        io.to(`chat:${data.chatId}`).emit('new-message', {
          ...data,
          user: {
            id: socket.data.user?.id,
            name: socket.data.user?.name,
          },
        });
      });
      
      // Набір тексту
      socket.on('typing', (data) => {
        // Трансляція інформації про набір тексту всім учасникам чату, крім відправника
        socket.to(`chat:${data.chatId}`).emit('user-typing', {
          userId: socket.data.user?.id,
          userName: socket.data.user?.name,
          isTyping: data.isTyping,
        });
      });
      
      // Прочитання повідомлення
      socket.on('read-message', (data) => {
        io.to(`chat:${data.chatId}`).emit('message-read', {
          messageId: data.messageId,
          userId: socket.data.user?.id,
        });
      });
      
      // Від'єднання
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.data.user?.id || 'unknown'}`);
      });
    });

    // Збереження інстансу io для повторного використання
    res.socket.server.io = io;
  }
  
  return res.socket.server.io;
};

// Тип для NextApiResponse з Socket.io
declare module 'http' {
  interface Server {
    io?: ServerIO;
  }
}