// src/app/api/socketio/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { startSocketServer, getIOInstance } from '@/lib/socket-service';

// Забезпечуємо, що Socket.io сервер запущений
startSocketServer();

export async function GET(req: NextRequest) {
  try {
    // Отримуємо інстанс Socket.io
    const io = getIOInstance();

    // Успішна відповідь з інформацією про сервер
    return NextResponse.json(
      {
        success: true,
        message: 'Socket.io server is running',
        clients: io ? io.engine.clientsCount : 0,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error('Socket.io API error:', error);
    return NextResponse.json({ success: false, error: 'Socket.io API error' }, { status: 500 });
  }
}

export async function OPTIONS(req: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
