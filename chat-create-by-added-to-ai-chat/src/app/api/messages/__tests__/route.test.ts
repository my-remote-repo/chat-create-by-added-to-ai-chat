// @ts-nocheck - вимкнення перевірок типів для файлу тестів
// src/app/api/messages/__tests__/route.test.ts
import { describe, it, expect, beforeEach, jest, afterEach } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';
import { GET, PUT, DELETE } from '../[messageId]/route'; // Коректний шлях до route.ts
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';
import * as authHelpers from '@/lib/auth-helpers';

// Типи для тестів
interface Message {
  id: string;
  content: string;
  userId: string;
}

// Встановлюємо глобальні моки
jest.mock('@/lib/auth-helpers', () => ({
  verifyTokenAndCheckBlacklist: jest.fn(),
}));

jest.mock('@/shared/infrastructure/DependencyInjection', () => ({
  ServiceFactory: {
    createMessageService: jest.fn(),
  },
}));

describe('Message API Routes', () => {
  // Налаштування для тестів
  let mockRequest;
  let mockMessageService;
  let mockParams;

  beforeEach(() => {
    // Скидаємо моки
    jest.resetAllMocks();

    // Мокуємо NextRequest
    mockRequest = {
      url: 'http://localhost:3000/api/messages/test-message-id',
      json: jest.fn(),
    };

    // Встановлюємо поведінку json
    mockRequest.json.mockResolvedValue({});

    // Встановлюємо параметри маршруту
    mockParams = { messageId: 'test-message-id' };

    // Мокуємо Auth перевірку
    const verifyToken = authHelpers.verifyTokenAndCheckBlacklist;
    verifyToken.mockImplementation(() => {
      return Promise.resolve({
        isAuthorized: true,
        userId: 'test-user-id',
        email: 'test@example.com',
        role: 'user',
      });
    });

    // Створюємо мок сервіс
    mockMessageService = {
      getMessageById: jest.fn(),
      editMessage: jest.fn(),
      deleteMessage: jest.fn(),
    };

    // Встановлюємо поведінку методів сервісу
    mockMessageService.getMessageById.mockResolvedValue(null);
    mockMessageService.editMessage.mockResolvedValue(null);
    mockMessageService.deleteMessage.mockResolvedValue(false);

    // Встановлюємо мок сервіса
    ServiceFactory.createMessageService.mockReturnValue(mockMessageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/messages/:messageId', () => {
    it('should return message for authorized user', async () => {
      // Arrange
      const mockMessage = {
        id: 'test-message-id',
        content: 'Test message',
        userId: 'test-user-id',
      };

      mockMessageService.getMessageById.mockResolvedValue(mockMessage);

      // Act
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(authHelpers.verifyTokenAndCheckBlacklist).toHaveBeenCalledWith(mockRequest);
      expect(mockMessageService.getMessageById).toHaveBeenCalledWith(
        'test-message-id',
        'test-user-id'
      );
      expect(data).toEqual(mockMessage);
    });

    it('should return 404 if message not found', async () => {
      // Arrange
      mockMessageService.getMessageById.mockResolvedValue(null);

      // Act
      const response = await GET(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Message not found' });
    });
  });

  describe('PUT /api/messages/:messageId', () => {
    it('should update message for authorized user', async () => {
      // Arrange
      const existingMessage = {
        id: 'test-message-id',
        content: 'Original content',
        userId: 'test-user-id',
      };

      const updateData = {
        content: 'Updated content',
      };

      const updatedMessage = {
        ...existingMessage,
        content: 'Updated content',
      };

      mockMessageService.getMessageById.mockResolvedValue(existingMessage);
      mockMessageService.editMessage.mockResolvedValue(updatedMessage);

      // Встановлюємо мок для json саме в цьому тесті
      mockRequest.json.mockResolvedValueOnce(updateData);

      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(mockRequest.json).toHaveBeenCalled();
      expect(mockMessageService.getMessageById).toHaveBeenCalledWith(
        'test-message-id',
        'test-user-id'
      );
      expect(mockMessageService.editMessage).toHaveBeenCalledWith(
        'test-message-id',
        'test-user-id',
        'Updated content'
      );
      expect(data).toEqual(updatedMessage);
    });

    it('should return 404 if message not found', async () => {
      // Arrange
      mockMessageService.getMessageById.mockResolvedValue(null);

      // Встановлюємо мок для json саме в цьому тесті
      mockRequest.json.mockResolvedValueOnce({
        content: 'Updated content',
      });

      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Message not found' });
      expect(mockMessageService.editMessage).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not the author', async () => {
      // Arrange
      const existingMessage = {
        id: 'test-message-id',
        content: 'Original content',
        userId: 'other-user-id', // Інший користувач
      };

      mockMessageService.getMessageById.mockResolvedValue(existingMessage);

      // Встановлюємо мок для json саме в цьому тесті
      mockRequest.json.mockResolvedValueOnce({
        content: 'Updated content',
      });

      // Act
      const response = await PUT(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(data).toEqual({ error: 'You can only edit your own messages' });
      expect(mockMessageService.editMessage).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/messages/:messageId', () => {
    it('should delete message for authorized user', async () => {
      // Arrange
      const existingMessage = {
        id: 'test-message-id',
        content: 'Test message',
        userId: 'test-user-id',
      };

      mockMessageService.getMessageById.mockResolvedValue(existingMessage);
      mockMessageService.deleteMessage.mockResolvedValue(true);

      // Act
      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(mockMessageService.getMessageById).toHaveBeenCalledWith(
        'test-message-id',
        'test-user-id'
      );
      expect(mockMessageService.deleteMessage).toHaveBeenCalledWith(
        'test-message-id',
        'test-user-id'
      );
      expect(data).toEqual({
        success: true,
        message: 'Message deleted successfully',
      });
    });

    it('should return 404 if message not found', async () => {
      // Arrange
      mockMessageService.getMessageById.mockResolvedValue(null);

      // Act
      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(404);
      expect(data).toEqual({ error: 'Message not found' });
      expect(mockMessageService.deleteMessage).not.toHaveBeenCalled();
    });

    it('should return 400 if deletion fails', async () => {
      // Arrange
      const existingMessage = {
        id: 'test-message-id',
        content: 'Test message',
        userId: 'test-user-id',
      };

      mockMessageService.getMessageById.mockResolvedValue(existingMessage);
      mockMessageService.deleteMessage.mockResolvedValue(false);

      // Act
      const response = await DELETE(mockRequest, { params: mockParams });
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data).toEqual({ error: 'Failed to delete message' });
    });
  });
});
