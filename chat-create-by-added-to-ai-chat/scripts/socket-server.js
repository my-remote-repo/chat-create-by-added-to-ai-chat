// socket-server.js
const { createServer } = require('http');
const { Server } = require('socket.io');

// Створюємо HTTP сервер
const httpServer = createServer();

// Створюємо Socket.IO сервер
const io = new Server(httpServer, {
  cors: {
    origin: '*', // В розробці дозволяємо всі джерела
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Мінімальна перевірка токена (для розробки)
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token) {
    // Зберігаємо дані користувача в сокеті для зручності
    socket.userId = socket.handshake.auth.userId;
    socket.userName = socket.handshake.auth.userName;
    next();
  } else {
    next(new Error('Authentication error: Token missing'));
  }
});

// Обробка підключення клієнтів
io.on('connection', socket => {
  console.log(`User connected: ${socket.userId}`);

  // Сповістити всіх про підключення
  socket.broadcast.emit('user-status-changed', {
    userId: socket.userId,
    status: 'online',
    timestamp: new Date().toISOString(),
  });

  // Обробник приєднання до чату
  socket.on('join-chat', chatId => {
    socket.join(`chat:${chatId}`);
    console.log(`User ${socket.userId} joined chat: ${chatId}`);
  });

  // Обробник відправки повідомлення
  socket.on('send-message', data => {
    console.log(`New message from ${socket.userId} in chat ${data.chatId}`);
    // Формуємо об'єкт повідомлення
    const message = {
      id: data.id || `msg-${Date.now()}`,
      content: data.content,
      chatId: data.chatId,
      userId: socket.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      readBy: [socket.userId],
      files: data.files || [],
      user: {
        id: socket.userId,
        name: socket.userName || 'Користувач',
        image: socket.handshake.auth.userImage || null,
      },
      replyToId: data.replyToId,
      tempId: data.tempId,
    };

    // Відправляємо всім учасникам чату
    io.to(`chat:${data.chatId}`).emit('new-message', message);
    // Повертаємо окремо відправнику підтвердження
    if (data.tempId) {
      socket.emit('message-status-updated', {
        messageId: data.tempId,
        status: 'sent',
        actualId: message.id,
      });
    }
  });

  // Обробник набору тексту
  socket.on('typing', data => {
    socket.to(`chat:${data.chatId}`).emit('user-typing', {
      userId: socket.userId,
      userName: socket.userName || 'Користувач',
      chatId: data.chatId,
      isTyping: data.isTyping,
    });
  });

  // Обробник прочитання повідомлень
  socket.on('read-message', data => {
    io.to(`chat:${data.chatId}`).emit('messages-read', {
      userId: socket.userId,
      chatId: data.chatId,
      timestamp: new Date().toISOString(),
    });
  });

  // Обробник відключення
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    // Сповіщаємо всіх про відключення
    socket.broadcast.emit('user-status-changed', {
      userId: socket.userId,
      status: 'offline',
      timestamp: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  });
});

// Запускаємо сервер на порту 3001
const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
