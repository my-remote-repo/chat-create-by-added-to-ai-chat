// src/domains/message/application/services/messageService.ts

import { MessageRepository } from '../../domain/repositories/messageRepository';
import { ChatRepository } from '@/domains/chat/domain/repositories/chatRepository';
import { redisClient } from '@/lib/redis-client';
import { Message } from '../../domain/entities/message';
import { File } from '../../domain/entities/file';
import { Chat } from '@/domains/chat/domain/entities/chat';

// Локальне оголошення типів
interface FileDTO {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  messageId?: string | null;
  chatId?: string | null;
  userId: string;
  createdAt: Date;
  formattedSize?: string;
  isImage?: boolean;
  isVideo?: boolean;
  isAudio?: boolean;
  isDocument?: boolean;
  extension?: string;
}

interface MessageDTO {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  replyToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  readBy: string[];
  files: FileDTO[];
  user?: {
    id: string;
    name: string;
    image?: string | null;
  };
  replyTo?: MessageDTO | null;
}

export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly chatRepository: ChatRepository
  ) {}

  /**
   * Отримати повідомлення за ID
   */
  async getMessageById(messageId: string, userId: string): Promise<MessageDTO | null> {
    try {
      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        return null;
      }

      // Перевірка, чи є користувач учасником чату
      const isParticipant = await this.chatRepository.isParticipant(message.chatId, userId);
      if (!isParticipant) {
        return null; // Користувач не має доступу до повідомлення
      }

      return message.toDTO();
    } catch (error) {
      console.error('Error fetching message:', error);
      return null;
    }
  }

  /**
   * Позначити повідомлення як прочитане
   */
  async markAsRead(messageId: string, userId: string): Promise<boolean> {
    try {
      // Отримуємо повідомлення
      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        return false;
      }

      // Перевірка, чи є користувач учасником чату
      const isParticipant = await this.chatRepository.isParticipant(message.chatId, userId);
      if (!isParticipant) {
        return false;
      }

      // Перевірка, чи повідомлення вже прочитане
      if (message.isReadBy(userId)) {
        return true;
      }

      // Позначаємо повідомлення як прочитане
      await this.messageRepository.markAsRead(messageId, userId);

      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  /**
   * Отримати повідомлення в чаті
   */
  async getChatMessages(
    chatId: string,
    userId: string,
    options: {
      limit?: number;
      before?: Date;
      after?: Date;
      cursor?: string;
      search?: string;
    } = {}
  ): Promise<MessageDTO[]> {
    try {
      // Перевірка, чи є користувач учасником чату
      const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
      if (!isParticipant) {
        return []; // Користувач не має доступу до чату
      }

      // Отримуємо повідомлення
      const messages = await this.messageRepository.findMessages({
        chatId,
        limit: options.limit,
        before: options.before,
        after: options.after,
        cursor: options.cursor,
        searchText: options.search,
      });

      // Автоматично позначаємо отримані повідомлення як прочитані
      for (const msg of messages) {
        if (!msg.isReadBy(userId)) {
          await this.messageRepository.markAsRead(msg.id, userId);
        }
      }

      // Оновлюємо час останнього прочитання для учасника
      const participant = await this.chatRepository.findParticipant(chatId, userId);
      if (participant) {
        const updatedParticipant = participant.markAsRead();
        await this.chatRepository.updateParticipant(updatedParticipant);
      }

      return messages.map(msg => msg.toDTO());
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Створити нове повідомлення
   */
  async createMessage(
    chatId: string,
    userId: string,
    content: string,
    replyToId?: string,
    files?: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
    }>
  ): Promise<MessageDTO | null> {
    try {
      // Перевірка, чи є користувач учасником чату
      const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
      if (!isParticipant) {
        return null; // Користувач не може відправляти повідомлення в цей чат
      }

      // Перевірка вмісту повідомлення
      if (!content && (!files || files.length === 0)) {
        return null; // Повідомлення не може бути порожнім
      }

      // Перевірка, якщо це відповідь на інше повідомлення
      if (replyToId) {
        const replyMessage = await this.messageRepository.findById(replyToId);
        if (!replyMessage || replyMessage.chatId !== chatId) {
          return null; // Некоректний replyToId
        }
      }

      // Створення файлів, якщо вони є
      const messageFiles: File[] = [];
      if (files && files.length > 0) {
        for (const fileData of files) {
          const file = new File({
            id: '', // буде згенеровано базою даних
            name: fileData.name,
            url: fileData.url,
            size: fileData.size,
            type: fileData.type,
            messageId: null, // буде встановлено після створення повідомлення
            chatId,
            userId,
            createdAt: new Date(),
          });

          messageFiles.push(file);
        }
      }

      // Створення нового повідомлення
      const message = new Message({
        id: '', // буде згенеровано базою даних
        content,
        chatId,
        userId,
        replyToId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        readBy: [userId], // автор повідомлення автоматично вважається таким, що прочитав його
        files: messageFiles,
      });

      // Зберігаємо повідомлення
      const createdMessage = await this.messageRepository.create(message);

      // Оновлюємо дату останньої активності чату через ChatRepository
      try {
        const chat = await this.chatRepository.findById(chatId);
        if (chat) {
          // Створюємо новий об'єкт чату з оновленою датою
          const updatedChat = new Chat({
            id: chat.id,
            name: chat.name,
            description: chat.description,
            isGroup: chat.isGroup,
            ownerId: chat.ownerId,
            createdAt: chat.createdAt,
            updatedAt: new Date(), // Оновлюємо тільки це поле
            participants: chat.participants,
          });
          await this.chatRepository.update(updatedChat);
        }
      } catch (error) {
        console.error(`Error updating chat activity for chat ${chatId}:`, error);
      }

      // Знімаємо статус набору тексту
      try {
        await redisClient.setUserTyping(chatId, userId, false);
      } catch (error) {
        console.error(`Error updating typing status for user ${userId} in chat ${chatId}:`, error);
      }

      return createdMessage.toDTO();
    } catch (error) {
      console.error('Error creating message:', error);
      return null;
    }
  }

  /**
   * Редагувати повідомлення
   */
  async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<MessageDTO | null> {
    try {
      // Отримуємо повідомлення
      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        return null;
      }

      // Перевірка, чи є користувач автором повідомлення
      if (message.userId !== userId) {
        return null; // Тільки автор може редагувати повідомлення
      }

      // Перевірка, чи не видалене повідомлення
      if (message.isDeleted) {
        return null; // Не можна редагувати видалені повідомлення
      }

      // Редагуємо повідомлення
      const updatedMessage = message.edit(content);

      // Зберігаємо оновлене повідомлення
      const savedMessage = await this.messageRepository.update(updatedMessage);

      return savedMessage.toDTO();
    } catch (error) {
      console.error('Error editing message:', error);
      return null;
    }
  }

  /**
   * Позначити всі повідомлення в чаті як прочитані
   */
  async markAllAsRead(chatId: string, userId: string): Promise<boolean> {
    try {
      // Перевірка, чи є користувач учасником чату
      const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
      if (!isParticipant) {
        return false;
      }

      // Перевіряємо, чи є непрочитані повідомлення
      const unreadCount = await this.messageRepository.countUnread(chatId, userId);

      // Якщо непрочитаних повідомлень немає, не робимо оновлень
      if (unreadCount === 0) {
        return true;
      }

      // Позначаємо всі повідомлення як прочитані
      await this.messageRepository.markAllAsRead(chatId, userId);

      // Оновлюємо час останнього прочитання для учасника
      const participant = await this.chatRepository.findParticipant(chatId, userId);
      if (participant) {
        const updatedParticipant = participant.markAsRead();
        await this.chatRepository.updateParticipant(updatedParticipant);
      }

      return true;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return false;
    }
  }

  /**
   * Видалити повідомлення
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    try {
      // Отримуємо повідомлення
      const message = await this.messageRepository.findById(messageId);

      if (!message) {
        return false;
      }

      // Отримуємо чат
      const chat = await this.chatRepository.findById(message.chatId);

      if (!chat) {
        return false;
      }

      // Перевірка прав: автор повідомлення, власник чату або адміністратор
      const participant = chat.participants.find(p => p.userId === userId);
      const canDelete =
        message.userId === userId ||
        chat.ownerId === userId ||
        (participant && participant.isAdmin);

      if (!canDelete) {
        return false;
      }

      // Видаляємо повідомлення (soft delete)
      await this.messageRepository.delete(messageId);

      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  /**
   * Встановити статус набору тексту
   */
  async setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<boolean> {
    try {
      // Перевірка, чи є користувач учасником чату
      const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
      if (!isParticipant) {
        return false;
      }

      // Встановлюємо статус набору тексту
      await redisClient.setUserTyping(chatId, userId, isTyping);

      return true;
    } catch (error) {
      console.error('Error setting typing status:', error);
      return false;
    }
  }

  /**
   * Отримати кількість непрочитаних повідомлень у чаті
   */
  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    return this.messageRepository.countUnread(chatId, userId);
  }

  /**
   * Отримати загальну кількість непрочитаних повідомлень для користувача
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.countTotalUnread(userId);
  }
}
