// scripts/socket-server.ts
import { createServer } from 'http';
import { config } from 'dotenv';
import { configureSocketServer } from '../src/lib/socket-service-server';

// Завантаження змінних середовища
config();

// Функція запуску сервера
async function startServer() {
  try {
    // Створюємо HTTP сервер
    const httpServer = createServer();

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

// Запуск сервера
startServer().catch(err => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
