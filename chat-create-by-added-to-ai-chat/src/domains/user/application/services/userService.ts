import { User, UserDTO } from "../../domain/entities/user";
import { UserRepository } from "../../domain/repositories/userRepository";

/**
 * Сервіс для роботи з користувачами
 * Реалізує бізнес-логіку для операцій з користувачами
 */
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Отримати профіль користувача за ID
   */
  async getUserProfile(userId: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);
    return user ? user.toDTO() : null;
  }

  /**
   * Оновити профіль користувача
   */
  async updateUserProfile(
    userId: string,
    name: string,
    bio?: string
  ): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return null;
    }
    
    const updatedUser = user.updateProfile(name, bio);
    await this.userRepository.update(updatedUser);
    
    return updatedUser.toDTO();
  }

  /**
   * Оновити аватар користувача
   */
  async updateUserAvatar(
    userId: string,
    imageUrl: string
  ): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return null;
    }
    
    const updatedUser = user.updateAvatar(imageUrl);
    await this.userRepository.update(updatedUser);
    
    return updatedUser.toDTO();
  }

  /**
   * Видалити користувача
   */
  async deleteUser(userId: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      return false;
    }
    
    await this.userRepository.delete(userId);
    return true;
  }

  /**
   * Пошук користувачів за ім'ям
   */
  async searchUsers(query: string, limit?: number): Promise<UserDTO[]> {
    const users = await this.userRepository.searchByName(query, limit);
    return users.map(user => user.toDTO());
  }
}