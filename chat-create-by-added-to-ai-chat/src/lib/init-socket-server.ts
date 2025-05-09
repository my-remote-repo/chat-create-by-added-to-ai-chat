// src/lib/init-socket-server.ts
import http from 'http';
import https from 'https';
import { io, getIOInstance } from './socket-service';
import { Server as SocketIOServer } from 'socket.io';

// Глобальні оголошення для типізації
declare global {
  var __httpServer: http.Server;
  var __httpsServer: https.Server;
  var __io: SocketIOServer | undefined;
}

// Функція ініціалізації для Next.js
export async function initSocketServer(server?: http.Server) {
  // Якщо передано сервер, зберігаємо його
  if (server) {
    globalThis.__httpServer = server;
  }

  // Зберігаємо інстанс io глобально
  if (io) {
    globalThis.__io = io;
  }

  // Повертаємо інстанс io
  return getIOInstance();
}
