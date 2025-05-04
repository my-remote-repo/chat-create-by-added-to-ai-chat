// src/domains/auth/domain/repositories/tokenRepository.ts
import { Token, TokenType } from '../entities/token';

export interface TokenRepository {
  /**
   * Створити новий токен
   */
  create(token: Token): Promise<Token>;

  /**
   * Знайти токен за значенням
   */
  findByToken(token: string, type?: TokenType): Promise<Token | null>;

  /**
   * Знайти токени користувача
   */
  findByUserId(userId: string, type?: TokenType): Promise<Token[]>;

  /**
   * Видалити токен
   */
  delete(id: string): Promise<void>;

  /**
   * Видалити токени користувача
   */
  deleteByUserId(userId: string, type?: TokenType): Promise<void>;

  /**
   * Видалити просрочені токени
   */
  deleteExpired(): Promise<void>;
}
