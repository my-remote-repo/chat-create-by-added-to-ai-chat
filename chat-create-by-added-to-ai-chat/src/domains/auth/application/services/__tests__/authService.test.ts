console.log('Тестовий файл завантажено');

// src/domains/auth/application/services/__tests__/authService.test.ts
import { AuthService } from '../authService';
import { UserRepository } from '@/domains/user/domain/repositories/userRepository';
import { User } from '@/domains/user/domain/entities/user';
import { prisma } from '@/lib/db';
import { redisClient } from '@/lib/redis-client';
import { hash } from 'bcryptjs';

// Mock залежностей
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
    verificationToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

jest.mock('@/lib/redis-client', () => ({
  redisClient: {
    setUserStatus: jest.fn(),
    getUserSession: jest.fn(),
  },
}));

// Простий мок без типізації
const mockJwtService = {
  generateTokens: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
};

const mockEmailService = {
  sendVerificationEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

// Мокуємо конструктори сервісів
jest.mock('@/domains/auth/infrastructure/services/jwtService', () => ({
  JwtService: jest.fn(() => mockJwtService),
}));

jest.mock('@/domains/auth/infrastructure/services/emailService', () => ({
  EmailService: jest.fn(() => mockEmailService),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepository: any;

  beforeEach(() => {
    // Очищаємо всі моки
    jest.clearAllMocks();

    // Встановлюємо значення мокам
    mockJwtService.generateTokens.mockResolvedValue({
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    });

    mockEmailService.sendVerificationEmail.mockResolvedValue(true);
    mockEmailService.sendPasswordResetEmail.mockResolvedValue(true);

    // Створюємо моки репозиторію
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      searchByName: jest.fn(),
      existsByEmail: jest.fn(),
    };

    // Створюємо екземпляр сервісу автентифікації
    authService = new AuthService(mockUserRepository as UserRepository);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const name = 'Test User';
      const email = 'test@example.com';
      const password = 'Password123';

      // Mock повертає false для existsByEmail (користувача не існує)
      mockUserRepository.existsByEmail.mockResolvedValue(false);

      // Mock для створення користувача
      const mockUser = new User({
        id: 'test-id',
        name,
        email,
        password: await hash(password, 12),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      mockUserRepository.create.mockResolvedValue(mockUser);

      // Act
      const result = await authService.register(name, email, password);

      // Assert
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(email);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.name).toBe(name);
      expect(result?.email).toBe(email);
    });

    it('should return null if user already exists', async () => {
      // Arrange
      const name = 'Test User';
      const email = 'test@example.com';
      const password = 'Password123';

      // Mock повертає true для existsByEmail (користувач існує)
      mockUserRepository.existsByEmail.mockResolvedValue(true);

      // Act
      const result = await authService.register(name, email, password);

      // Assert
      expect(mockUserRepository.existsByEmail).toHaveBeenCalledWith(email);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login user successfully with valid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const hashedPassword = await hash(password, 12);

      // Mock для пошуку користувача
      const mockUser = new User({
        id: 'test-id',
        name: 'Test User',
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Для доступу до приватних полів
      (mockUser as any).props.password = hashedPassword;

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(redisClient.setUserStatus).toHaveBeenCalledWith('test-id', 'online');
      expect(prisma.session.create).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.user.id).toBe('test-id');
      expect(result?.tokens.accessToken).toBe('test-access-token');
      expect(result?.tokens.refreshToken).toBe('test-refresh-token');
    });

    it('should return null with invalid credentials', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123';
      const wrongPassword = 'WrongPassword123';
      const hashedPassword = await hash(password, 12);

      // Mock для пошуку користувача
      const mockUser = new User({
        id: 'test-id',
        name: 'Test User',
        email,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Для доступу до приватних полів
      (mockUser as any).props.password = hashedPassword;

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(email, wrongPassword);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(redisClient.setUserStatus).not.toHaveBeenCalled();
      expect(prisma.session.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'Password123';

      // Mock повертає null для findByEmail (користувача не існує)
      mockUserRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = await authService.login(email, password);

      // Assert
      expect(mockUserRepository.findByEmail).toHaveBeenCalledWith(email);
      expect(redisClient.setUserStatus).not.toHaveBeenCalled();
      expect(prisma.session.create).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  // Додаткові тести...
});
