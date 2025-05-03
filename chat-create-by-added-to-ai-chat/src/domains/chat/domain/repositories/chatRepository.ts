import { Chat } from "../entities/chat";
import { Participant } from "../entities/participant";

/**
 * Опції для пошуку чатів
 */
export interface FindChatsOptions {
  userId: string;
  limit?: number;
  offset?: number;
  search?: string;
  onlyGroups?: boolean;
  onlyPersonal?: boolean;
  includeArchived?: boolean;
}

/**
 * Інтерфейс репозиторію чатів
 */
export interface ChatRepository {
  /**
   * Знайти чат за ID
   */
  findById(id: string, includeParticipants?: boolean): Promise<Chat | null>;
  
  /**
   * Знайти всі чати для користувача
   */
  findChats(options: FindChatsOptions): Promise<Chat[]>;
  
  /**
   * Створити новий чат
   */
  create(chat: Chat): Promise<Chat>;
  
  /**
   * Оновити існуючий чат
   */
  update(chat: Chat): Promise<Chat>;
  
  /**
   * Видалити чат
   */
  delete(id: string): Promise<void>;
  
  /**
   * Додати учасника до чату
   */
  addParticipant(participant: Participant): Promise<void>;
  
  /**
   * Видалити учасника з чату
   */
  removeParticipant(chatId: string, userId: string): Promise<void>;
  
  /**
   * Оновити учасника чату
   */
  updateParticipant(participant: Participant): Promise<void>;
  
  /**
   * Знайти учасника чату
   */
  findParticipant(chatId: string, userId: string): Promise<Participant | null>;
  
  /**
   * Знайти всіх учасників чату
   */
  findParticipants(chatId: string): Promise<Participant[]>;
  
  /**
   * Перевірити чи є користувач учасником чату
   */
  isParticipant(chatId: string, userId: string): Promise<boolean>;
  
  /**
   * Знайти особистий чат між двома користувачами
   */
  findPersonalChat(userOneId: string, userTwoId: string): Promise<Chat | null>;
}