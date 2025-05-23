// socket-server.js
const { createServer } = require('http');
require('dotenv').config();

// Динамічний імпорт сконфігурованого сервера
async function startServer() {
  try {
    // Створюємо HTTP сервер
    const httpServer = createServer();

    // Імпортуємо модуль, скомпільований з TypeScript
    // Потрібно використовувати require для визначення шляху до скомпільованого файлу
    const modulePath = '../src/lib/socket-service-server.ts';
    const { configureSocketServer } = require(modulePath);

    // Налаштовуємо Socket.IO сервер
    const io = configureSocketServer(httpServer);

    // Запускаємо сервер на порту 3001
    const PORT = process.env.SOCKET_PORT || 3001;
    httpServer.listen(PORT, () => {
      console.log(`Socket.IO server running on port ${PORT}`);
    });

    // Обробка помилок процесу
    process.on('uncaughtException', error => {
      console.error('Uncaught Exception:', error);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection:', reason);
    });

    // Обробка зупинки процесу
    process.on('SIGINT', () => {
      console.log('Shutting down socket server...');
      httpServer.close(() => {
        console.log('Socket server shutdown complete');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Error starting socket server:', error);
    process.exit(1);
  }
}

// Запуск сервера (без async/await на верхньому рівні)
startServer().catch(err => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
