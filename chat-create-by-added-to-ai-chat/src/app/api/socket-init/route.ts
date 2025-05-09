// src/app/api/socket-init/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { startSocketServer } from '@/lib/socket-service';

// Стан для відстеження, чи запущений сервер
let socketStarted = false;

export async function GET(req: NextRequest) {
  if (!socketStarted) {
    console.log('Starting Socket.io server from API route...');
    const io = startSocketServer();
    socketStarted = io !== null;

    if (socketStarted) {
      return NextResponse.json({
        status: 'success',
        message: 'Socket.io server started on port 3001',
      });
    } else {
      return NextResponse.json(
        { status: 'error', message: 'Failed to start Socket.io server' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ status: 'info', message: 'Socket.io server already running' });
}
