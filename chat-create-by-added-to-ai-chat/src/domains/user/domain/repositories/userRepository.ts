import { User } from '../entities/user';
import { UserSettings } from '../entities/userSettings';

export interface UserRepository {
  // Існуючі методи
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  delete(id: string): Promise<void>;
  searchByName(query: string, limit?: number): Promise<User[]>;
  existsByEmail(email: string): Promise<boolean>;

  // Нові методи для налаштувань
  findUserSettings(userId: string): Promise<UserSettings | null>;
  saveUserSettings(settings: UserSettings): Promise<UserSettings>;

  // Методи для статусів
  getUsersWithStatus(status: string, limit?: number): Promise<User[]>;
  updateUserStatus(userId: string, status: string): Promise<void>;
}
