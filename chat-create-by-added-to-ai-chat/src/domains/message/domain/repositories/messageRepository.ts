import { Message } from "../entities/message";
import { File } from "../entities/file";

/**
 * Опції для пошуку повідомлень
 */
export interface FindMessagesOptions {
  chatId: string;
  limit?: number;
  before?: Date;
  after?: Date;
  cursor?: string; // id повідомлення для пагінації
  includeFiles?: boolean;
  searchText?: string;
}

/**
 * Інтерфейс репозиторію повідомлень
 */
export interface MessageRepository {
  /**
   * Знайти повідомлення за ID
   */
  findById(id: string): Promise<Message | null>;
  
  /**
   * Знайти повідомлення в чаті
   */
  findMessages(options: FindMessagesOptions): Promise<Message[]>;
  
  /**
   * Знайти останні повідомлення для списку чатів
   */
  findLastMessages(chatIds: string[]): Promise<Record<string, Message>>;
  
  /**
   * Створити нове повідомлення
   */
  create(message: Message): Promise<Message>;
  
  /**
   * Оновити існуюче повідомлення
   */
  update(message: Message): Promise<Message>;
  
  /**
   * Видалити повідомлення (soft delete)
   */
  delete(id: string): Promise<void>;
  
  /**
   * Відмітити повідомлення як прочитане користувачем
   */
  markAsRead(messageId: string, userId: string): Promise<void>;
  
  /**
   * Відмітити всі повідомлення в чаті як прочитані користувачем
   */
  markAllAsRead(chatId: string, userId: string): Promise<void>;
  
  /**
   * Підрахувати кількість непрочитаних повідомлень в чаті
   */
  countUnread(chatId: string, userId: string): Promise<number>;
  
  /**
   * Підрахувати загальну кількість непрочитаних повідомлень для користувача
   */
  countTotalUnread(userId: string): Promise<number>;
  
  /**
   * Пошук повідомлень за текстом
   */
  search(userId: string, query: string, limit?: number): Promise<Message[]>;
  
  /**
   * Зберегти файл
   */
  saveFile(file: File): Promise<File>;
  
  /**
   * Видалити файл
   */
  deleteFile(id: string): Promise<void>;
  
  /**
   * Знайти файли повідомлення
   */
  findMessageFiles(messageId: string): Promise<File[]>;
}