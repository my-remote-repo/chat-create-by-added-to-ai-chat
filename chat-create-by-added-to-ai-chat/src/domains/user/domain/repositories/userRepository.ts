import { User } from "../entities/user";

/**
 * Інтерфейс репозиторію користувача
 * Визначає методи для роботи з даними користувача
 */
export interface UserRepository {
  /**
   * Отримати користувача за ID
   */
  findById(id: string): Promise<User | null>;
  
  /**
   * Отримати користувача за email
   */
  findByEmail(email: string): Promise<User | null>;
  
  /**
   * Створити нового користувача
   */
  create(user: User): Promise<User>;
  
  /**
   * Оновити існуючого користувача
   */
  update(user: User): Promise<User>;
  
  /**
   * Видалити користувача
   */
  delete(id: string): Promise<void>;
  
  /**
   * Пошук користувачів за ім'ям (для пошуку при створенні чату)
   */
  searchByName(query: string, limit?: number): Promise<User[]>;
  
  /**
   * Перевірка чи існує користувач з вказаним email
   */
  existsByEmail(email: string): Promise<boolean>;
}