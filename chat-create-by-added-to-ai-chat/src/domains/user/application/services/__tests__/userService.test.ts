import { UserService } from '../userService';
import { UserRepository } from '@/domains/user/domain/repositories/userRepository';
import { User } from '@/domains/user/domain/entities/user';
import { UserSettings } from '@/domains/user/domain/entities/userSettings';
import { redisClient } from '@/lib/redis-client';

// Мокуємо залежності
jest.mock('@/lib/redis-client', () => ({
  redisClient: {
    getUserStatus: jest.fn(),
    setUserStatus: jest.fn(),
    getUsersByStatus: jest.fn(),
  },
}));

// Мокуємо ImageService
jest.mock('../../../infrastructure/services/imageService', () => ({
  ImageService: jest.fn().mockImplementation(() => ({
    processAndSaveAvatar: jest
      .fn()
      .mockResolvedValue(
        '{"original":"/uploads/avatars/test-id/avatar.webp","128":"/uploads/avatars/test-id/avatar_128.webp"}'
      ),
  })),
}));

describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Створюємо моки репозиторію
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      searchByName: jest.fn(),
      existsByEmail: jest.fn(),
      findUserSettings: jest.fn(),
      saveUserSettings: jest.fn(),
      getUsersWithStatus: jest.fn(),
      updateUserStatus: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    // Ініціалізуємо сервіс з моком репозиторію
    userService = new UserService(mockUserRepository);

    // Скидаємо всі виклики моків
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile with status', async () => {
      // Arrange
      const mockUser = new User({
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      (redisClient.getUserStatus as jest.Mock).mockResolvedValue('online');

      // Act
      const result = await userService.getUserProfile('test-id');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('test-id');
      expect(redisClient.getUserStatus).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        status: 'online',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      // Act
      const result = await userService.getUserProfile('test-id');

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toBeNull();
    });
  });

  describe('getUserSettings', () => {
    it('should return user settings when found', async () => {
      // Arrange
      const mockSettings = new UserSettings({
        userId: 'test-id',
        theme: 'dark',
        language: 'uk',
        notificationsEnabled: true,
        soundsEnabled: true,
        desktopNotifications: true,
        emailNotifications: true,
        showReadReceipts: true,
        showOnlineStatus: true,
      });

      mockUserRepository.findUserSettings.mockResolvedValue(mockSettings);

      // Act
      const result = await userService.getUserSettings('test-id');

      // Assert
      expect(mockUserRepository.findUserSettings).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        userId: 'test-id',
        theme: 'dark',
        language: 'uk',
        notificationsEnabled: true,
        soundsEnabled: true,
        desktopNotifications: true,
        emailNotifications: true,
        showReadReceipts: true,
        showOnlineStatus: true,
      });
    });

    it('should create and return default settings when not found', async () => {
      // Arrange
      mockUserRepository.findUserSettings.mockResolvedValue(null);

      // Мок для saveUserSettings
      mockUserRepository.saveUserSettings.mockImplementation(settings => Promise.resolve(settings));

      // Act
      const result = await userService.getUserSettings('test-id');

      // Assert
      expect(mockUserRepository.findUserSettings).toHaveBeenCalledWith('test-id');
      expect(mockUserRepository.saveUserSettings).toHaveBeenCalled();
      expect(result).toEqual({
        userId: 'test-id',
        theme: 'system',
        language: 'uk',
        notificationsEnabled: true,
        soundsEnabled: true,
        desktopNotifications: true,
        emailNotifications: true,
        showReadReceipts: true,
        showOnlineStatus: true,
      });
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      // Arrange
      mockUserRepository.updateUserStatus.mockResolvedValue();

      // Act
      const result = await userService.updateUserStatus('test-id', 'ONLINE');

      // Assert
      expect(mockUserRepository.updateUserStatus).toHaveBeenCalledWith('test-id', 'ONLINE');
      expect(result).toBe(true);
    });

    it('should return false when update fails', async () => {
      // Arrange
      mockUserRepository.updateUserStatus.mockRejectedValue(new Error('Update failed'));

      // Act
      const result = await userService.updateUserStatus('test-id', 'ONLINE');

      // Assert
      expect(mockUserRepository.updateUserStatus).toHaveBeenCalledWith('test-id', 'ONLINE');
      expect(result).toBe(false);
    });
  });

  describe('updateUserAvatar', () => {
    it('should process and update user avatar', async () => {
      // Arrange
      const mockUser = new User({
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockUserRepository.update.mockImplementation(user => Promise.resolve(user));

      const imageBuffer = Buffer.from('test-image');
      const mimeType = 'image/jpeg';

      // Act
      const result = await userService.updateUserAvatar('test-id', imageBuffer, mimeType);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('test-id');
      expect(mockUserRepository.update).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-id',
          name: 'Test User',
          email: 'test@example.com',
        })
      );
    });

    it('should return null when user not found', async () => {
      // Arrange
      mockUserRepository.findById.mockResolvedValue(null);

      const imageBuffer = Buffer.from('test-image');
      const mimeType = 'image/jpeg';

      // Act
      const result = await userService.updateUserAvatar('test-id', imageBuffer, mimeType);

      // Assert
      expect(mockUserRepository.findById).toHaveBeenCalledWith('test-id');
      expect(result).toBeNull();
    });
  });

  describe('searchUsers', () => {
    it('should search users and include their statuses', async () => {
      // Arrange
      const mockUsers = [
        new User({
          id: 'user1',
          name: 'User One',
          email: 'user1@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
        new User({
          id: 'user2',
          name: 'User Two',
          email: 'user2@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ];

      mockUserRepository.searchByName.mockResolvedValue(mockUsers);
      (redisClient.getUserStatus as jest.Mock)
        .mockResolvedValueOnce('online')
        .mockResolvedValueOnce('offline');

      // Act
      const result = await userService.searchUsers('User', 10);

      // Assert
      expect(mockUserRepository.searchByName).toHaveBeenCalledWith('User', 10);
      expect(redisClient.getUserStatus).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        {
          id: 'user1',
          name: 'User One',
          email: 'user1@example.com',
          status: 'online',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
        {
          id: 'user2',
          name: 'User Two',
          email: 'user2@example.com',
          status: 'offline',
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        },
      ]);
    });
  });
});
