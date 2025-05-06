import { User, UserDTO } from '../../domain/entities/user';
import { UserSettings, UserSettingsDTO } from '../../domain/entities/userSettings';
import { UserRepository } from '../../domain/repositories/userRepository';
import { redisClient } from '@/lib/redis-client';
import { ImageService } from '../../infrastructure/services/imageService';

export class UserService {
  private readonly imageService: ImageService;

  constructor(private readonly userRepository: UserRepository) {
    this.imageService = new ImageService();
  }

  /**
   * Отримати профіль користувача за ID
   */
  async getUserProfile(userId: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    // Отримуємо поточний статус із Redis
    const status = await redisClient.getUserStatus(userId);

    const userDTO = user.toDTO();

    // Додаємо статус до DTO
    return {
      ...userDTO,
      status,
    };
  }

  /**
   * Отримати налаштування користувача
   */
  async getUserSettings(userId: string): Promise<UserSettingsDTO | null> {
    let settings = await this.userRepository.findUserSettings(userId);

    // Якщо налаштувань немає, створюємо їх за замовчуванням
    if (!settings) {
      settings = new UserSettings({
        userId,
        theme: 'system',
        language: 'uk',
        notificationsEnabled: true,
        soundsEnabled: true,
        desktopNotifications: true,
        emailNotifications: true,
        showReadReceipts: true,
        showOnlineStatus: true,
      });

      settings = await this.userRepository.saveUserSettings(settings);
    }

    return settings.toDTO();
  }

  /**
   * Оновити налаштування користувача
   */
  async updateUserSettings(
    userId: string,
    settingsData: Partial<UserSettingsDTO>
  ): Promise<UserSettingsDTO | null> {
    // Отримуємо поточні налаштування
    let settings = await this.userRepository.findUserSettings(userId);

    // Якщо налаштувань немає, створюємо їх за замовчуванням
    if (!settings) {
      settings = new UserSettings({
        userId,
        theme: 'system',
        language: 'uk',
        notificationsEnabled: true,
        soundsEnabled: true,
        desktopNotifications: true,
        emailNotifications: true,
        showReadReceipts: true,
        showOnlineStatus: true,
        ...settingsData,
      });
    } else {
      // Інакше оновлюємо існуючі
      settings = settings.update(settingsData);
    }

    // Зберігаємо оновлені налаштування
    const updatedSettings = await this.userRepository.saveUserSettings(settings);

    return updatedSettings.toDTO();
  }

  /**
   * Оновити профіль користувача
   */
  async updateUserProfile(userId: string, name: string, bio?: string): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    const updatedUser = user.updateProfile(name, bio);
    await this.userRepository.update(updatedUser);

    return updatedUser.toDTO();
  }

  /**
   * Обробка та оновлення аватара користувача
   */
  async updateUserAvatar(
    userId: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<UserDTO | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    // Оптимізуємо і зберігаємо зображення
    const imageUrl = await this.imageService.processAndSaveAvatar(userId, imageBuffer, mimeType);

    // Оновлюємо користувача з новим аватаром
    const updatedUser = user.updateAvatar(imageUrl);
    await this.userRepository.update(updatedUser);

    return updatedUser.toDTO();
  }

  /**
   * Оновити статус користувача
   */
  async updateUserStatus(
    userId: string,
    status: 'ONLINE' | 'OFFLINE' | 'AWAY' | 'BUSY'
  ): Promise<boolean> {
    try {
      await this.userRepository.updateUserStatus(userId, status);
      return true;
    } catch (error) {
      console.error('Failed to update user status:', error);
      return false;
    }
  }

  /**
   * Отримати онлайн користувачів
   */
  async getOnlineUsers(limit?: number): Promise<UserDTO[]> {
    const users = await this.userRepository.getUsersWithStatus('ONLINE', limit);
    return users.map(user => user.toDTO());
  }

  /**
   * Пошук користувачів за ім'ям
   */
  async searchUsers(query: string, limit?: number): Promise<UserDTO[]> {
    const users = await this.userRepository.searchByName(query, limit);

    // Збагачуємо результати статусами з Redis
    const usersWithStatus = await Promise.all(
      users.map(async user => {
        const status = await redisClient.getUserStatus(user.id);
        const userDTO = user.toDTO();
        return {
          ...userDTO,
          status,
        };
      })
    );

    return usersWithStatus;
  }
}
