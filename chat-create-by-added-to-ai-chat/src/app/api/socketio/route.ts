// src/app/api/socketio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { initSocketServer } from '@/lib/socket';

export async function GET(req: NextRequest) {
  try {
    // Шукаємо серверний сокет
    const res = {} as any;
    res.socket = {
      server:
        req.nextUrl.protocol === 'https:' ? globalThis.__httpsServer : globalThis.__httpServer,
    };

    // Ініціалізуємо Socket.io сервер
    const io = await initSocketServer(req as any, res as any);

    if (!io) {
      return NextResponse.json({ error: 'Failed to initialize Socket.io server' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Socket.io server is running',
      clients: io.engine.clientsCount,
    });
  } catch (error) {
    console.error('Socket.io initialization error:', error);
    return NextResponse.json(
      { success: false, error: 'Socket.io initialization error' },
      { status: 500 }
    );
  }
}
