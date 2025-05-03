import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

/**
 * Розширений тип для NextApiResponse з Socket.io
 */
export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

/**
 * Тип для події нового повідомлення
 */
export interface NewMessageEvent {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  createdAt: Date;
  files?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  replyToId?: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
}

/**
 * Тип для події набору тексту
 */
export interface TypingEvent {
  userId: string;
  userName: string;
  chatId: string;
  isTyping: boolean;
}

/**
 * Тип для події прочитання повідомлення
 */
export interface MessageReadEvent {
  messageId: string;
  chatId: string;
  userId: string;
}

/**
 * Тип для події оновлення статусу користувача
 */
export interface UserStatusEvent {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

/**
 * Тип для події оновлення чату
 */
export interface ChatUpdateEvent {
  id: string;
  updatedAt: Date;
  updatedBy: string;
  type: 'created' | 'updated' | 'deleted' | 'member_added' | 'member_removed';
  data?: any;
}