// @ts-nocheck - вимкнення перевірок типів для файлу тестів
// src/app/api/chat/__tests__/route.test.ts
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, POST } from '../route';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import * as authHelpers from '@/lib/auth-helpers';

// Мокуємо залежності
jest.mock('@/lib/auth-helpers', () => ({
  verifyTokenAndCheckBlacklist: jest.fn(),
}));

jest.mock('@/shared/infrastructure/DependencyInjection', () => ({
  ServiceFactory: {
    createChatService: jest.fn(),
  },
}));

describe('Chat API Routes', () => {
  // Налаштування для тестів
  let mockRequest;
  let mockChatService;

  beforeEach(() => {
    // Скидаємо моки
    jest.resetAllMocks();

    // Мокуємо NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/chat',
      json: jest.fn(),
    };

    // Встановлюємо базову поведінку json
    mockRequest.json.mockResolvedValue({});

    // Мокуємо Auth перевірку
    const verifyToken = authHelpers.verifyTokenAndCheckBlacklist;
    verifyToken.mockImplementation(() => {
      return Promise.resolve({
        isAuthorized: true,
        userId: 'test-user-id',
      });
    });

    // Мокуємо ChatService
    mockChatService = {
      getUserChats: jest.fn(),
      createOrGetPersonalChat: jest.fn(),
      createGroupChat: jest.fn(),
    };

    // Встановлюємо базову поведінку сервісу
    mockChatService.getUserChats.mockResolvedValue([]);
    mockChatService.createOrGetPersonalChat.mockResolvedValue({});
    mockChatService.createGroupChat.mockResolvedValue({});

    // Встановлюємо мок сервісу
    ServiceFactory.createChatService.mockReturnValue(mockChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/chat', () => {
    it('should return chats for authorized user', async () => {
      // Arrange
      const mockChats = [{ id: 'chat1' }, { id: 'chat2' }];
      mockChatService.getUserChats.mockResolvedValue(mockChats);

      // Встановлюємо URL з параметрами
      Object.defineProperty(mockRequest, 'url', {
        value: 'http://localhost:3000/api/chat?limit=10&onlyGroups=true',
        writable: true,
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(authHelpers.verifyTokenAndCheckBlacklist).toHaveBeenCalledWith(mockRequest);
      expect(mockChatService.getUserChats).toHaveBeenCalledWith('test-user-id', {
        cursor: null,
        limit: 10,
        onlyGroups: true,
        onlyPersonal: false,
        search: '',
        includeArchived: false,
      });
      expect(data).toEqual(mockChats);
    });

    it('should return 401 if unauthorized', async () => {
      // Arrange
      authHelpers.verifyTokenAndCheckBlacklist.mockImplementation(() => {
        return Promise.resolve({
          isAuthorized: false,
          error: 'Unauthorized',
          statusCode: 401,
        });
      });

      // Act
      const response = await GET(mockRequest);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Unauthorized' });
      expect(mockChatService.getUserChats).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/chat', () => {
    it('should create a new personal chat', async () => {
      // Arrange
      const chatData = {
        type: 'personal',
        participants: ['other-user-id'],
      };

      const expectedChat = {
        id: 'new-chat-id',
        isGroup: false,
        participants: [{ userId: 'test-user-id' }, { userId: 'other-user-id' }],
      };

      mockRequest.json.mockResolvedValue(chatData);
      mockChatService.createOrGetPersonalChat.mockResolvedValue(expectedChat);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockChatService.createOrGetPersonalChat).toHaveBeenCalledWith(
        'test-user-id',
        'other-user-id'
      );
      expect(data).toEqual(expectedChat);
      expect(response.status).toBe(201);
    });

    it('should create a new group chat', async () => {
      // Arrange
      const chatData = {
        type: 'group',
        name: 'Test Group',
        description: 'Test Description',
        participants: ['other-user-1', 'other-user-2'],
      };

      const expectedChat = {
        id: 'new-group-id',
        name: 'Test Group',
        description: 'Test Description',
        isGroup: true,
        ownerId: 'test-user-id',
        participants: [
          { userId: 'test-user-id' },
          { userId: 'other-user-1' },
          { userId: 'other-user-2' },
        ],
      };

      mockRequest.json.mockResolvedValue(chatData);
      mockChatService.createGroupChat.mockResolvedValue(expectedChat);

      // Act
      const response = await POST(mockRequest);
      const data = await response.json();

      // Assert
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockChatService.createGroupChat).toHaveBeenCalledWith(
        'Test Group',
        'test-user-id',
        ['other-user-1', 'other-user-2', 'test-user-id'],
        'Test Description'
      );
      expect(data).toEqual(expectedChat);
      expect(response.status).toBe(201);
    });

    it('should return 400 if validation fails', async () => {
      // Arrange
      const chatData = {
        type: 'group', // група, але без імені
        participants: [],
      };

      mockRequest.json.mockResolvedValue(chatData);

      // Act
      const response = await POST(mockRequest);

      // Assert
      expect(response.status).toBe(400);
      expect(mockChatService.createGroupChat).not.toHaveBeenCalled();
      expect(mockChatService.createOrGetPersonalChat).not.toHaveBeenCalled();
    });
  });
});
