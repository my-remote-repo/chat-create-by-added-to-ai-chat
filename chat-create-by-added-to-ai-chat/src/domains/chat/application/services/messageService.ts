import { MessageRepository } from '@/domains/message/domain/repositories/messageRepository';
import { ChatRepository } from '@/domains/chat/domain/repositories/chatRepository';
import { redisClient } from '@/lib/mock-redis-client';

// Оголошення типів, якщо модулі не знайдені
interface MessageDTO {
  id: string;
  content: string;
  chatId: string;
  userId: string;
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
  formattedSize: string;
  isImage: boolean;
  isVideo: boolean;
  isAudio: boolean;
  isDocument: boolean;
  extension: string;
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

    // Позначаємо повідомлення як прочитані
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
    // Перевірка, чи є користувач учасником чату
    const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) {
      return null; // Користувач не може відправляти повідомлення в цей чат
    }

    // Отримуємо репозиторій повідомлень
    const { Message, File } = require('@/domains/message/domain/entities');

    // Створення файлів
    const messageFiles = [];
    if (files && files.length > 0) {
      for (const fileData of files) {
        const file = new File({
          id: '', // буде згенеровано базою даних
          name: fileData.name,
          url: fileData.url,
          size: fileData.size,
          type: fileData.type,
          chatId,
          userId,
          createdAt: new Date(),
        });

        messageFiles.push(file);
      }
    }

    // Створення повідомлення
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

    // Надсилаємо сповіщення про нове повідомлення
    // Замість Redis використовуємо WebSocket або інший механізм повідомлень
    this.notifyNewMessage({
      id: createdMessage.id,
      content: createdMessage.content,
      chatId: createdMessage.chatId,
      userId: createdMessage.userId,
      createdAt: createdMessage.createdAt,
    });

    // Позначаємо, що користувач перестав друкувати
    await redisClient.setUserTyping(chatId, userId, false);

    return createdMessage.toDTO();
  }

  /**
   * Редагувати повідомлення
   */
  async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<MessageDTO | null> {
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

    // Надсилаємо сповіщення про оновлення повідомлення
    this.notifyMessageUpdated({
      id: savedMessage.id,
      content: savedMessage.content,
      chatId: savedMessage.chatId,
      updatedAt: savedMessage.updatedAt,
      userId: savedMessage.userId,
    });

    return savedMessage.toDTO();
  }

  /**
   * Видалити повідомлення
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
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
      message.userId === userId || chat.ownerId === userId || (participant && participant.isAdmin);

    if (!canDelete) {
      return false;
    }

    // Видаляємо повідомлення (soft delete)
    await this.messageRepository.delete(messageId);

    // Надсилаємо сповіщення про видалення повідомлення
    this.notifyMessageDeleted({
      id: messageId,
      chatId: message.chatId,
      deletedBy: userId,
    });

    return true;
  }

  /**
   * Позначити всі повідомлення в чаті як прочитані
   */
  async markAllAsRead(chatId: string, userId: string): Promise<boolean> {
    // Перевірка, чи є користувач учасником чату
    const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) {
      return false;
    }

    // Позначаємо всі повідомлення як прочитані
    await this.messageRepository.markAllAsRead(chatId, userId);

    // Оновлюємо час останнього прочитання для учасника
    const participant = await this.chatRepository.findParticipant(chatId, userId);
    if (participant) {
      const updatedParticipant = participant.markAsRead();
      await this.chatRepository.updateParticipant(updatedParticipant);
    }

    // Надсилаємо сповіщення про прочитані повідомлення
    this.notifyMessagesRead({
      chatId,
      userId,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Встановити статус набору тексту
   */
  async setTypingStatus(chatId: string, userId: string, isTyping: boolean): Promise<boolean> {
    // Перевірка, чи є користувач учасником чату
    const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) {
      return false;
    }

    // Встановлюємо статус набору тексту
    await redisClient.setUserTyping(chatId, userId, isTyping);

    return true;
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

  /**
   * Зберегти файл
   */
  async saveFile(
    userId: string,
    fileData: {
      name: string;
      url: string;
      size: number;
      type: string;
      chatId?: string;
      messageId?: string;
    }
  ): Promise<FileDTO | null> {
    // Перевірка, якщо вказано chatId, чи є користувач учасником чату
    if (fileData.chatId) {
      const isParticipant = await this.chatRepository.isParticipant(fileData.chatId, userId);
      if (!isParticipant) {
        return null;
      }
    }

    // Отримуємо клас File
    const { File } = require('@/domains/message/domain/entities');

    // Створення файлу
    const file = new File({
      id: '', // буде згенеровано базою даних
      name: fileData.name,
      url: fileData.url,
      size: fileData.size,
      type: fileData.type,
      messageId: fileData.messageId,
      chatId: fileData.chatId,
      userId,
      createdAt: new Date(),
    });

    // Зберігаємо файл
    const savedFile = await this.messageRepository.saveFile(file);

    return savedFile.toDTO();
  }

  /**
   * Видалити файл
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    // TODO: Додати перевірку прав на видалення файлу

    await this.messageRepository.deleteFile(fileId);

    return true;
  }

  /**
   * Метод для нотифікацій про нові повідомлення
   * Реалізація буде замінена на використання WebSocket або іншого механізму
   */
  private notifyNewMessage(data: any): void {
    console.log('New message notification:', data);
    // TODO: Реалізувати відправку через WebSocket або інший механізм
  }

  /**
   * Метод для нотифікацій про оновлення повідомлень
   */
  private notifyMessageUpdated(data: any): void {
    console.log('Message updated notification:', data);
    // TODO: Реалізувати відправку через WebSocket або інший механізм
  }

  /**
   * Метод для нотифікацій про видалення повідомлень
   */
  private notifyMessageDeleted(data: any): void {
    console.log('Message deleted notification:', data);
    // TODO: Реалізувати відправку через WebSocket або інший механізм
  }

  /**
   * Метод для нотифікацій про прочитання повідомлень
   */
  private notifyMessagesRead(data: any): void {
    console.log('Messages read notification:', data);
    // TODO: Реалізувати відправку через WebSocket або інший механізм
  }
}
