import { ChatRepository } from '@/domains/chat/domain/repositories/chatRepository';
import { PrismaChatRepository } from '@/domains/chat/infrastructure/repositories/prismaChatRepository';
import { MessageRepository } from '@/domains/message/domain/repositories/messageRepository';
import { PrismaMessageRepository } from '@/domains/message/infrastructure/repositories/prismaMessageRepository';
import { UserRepository } from '@/domains/user/domain/repositories/userRepository';
import { PrismaUserRepository } from '@/domains/user/infrastructure/repositories/prismaUserRepository';

// Клас-контейнер для залежностей
export class ServiceLocator {
  private static instance: ServiceLocator;
  private repositories: Map<string, any> = new Map();
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ServiceLocator {
    if (!ServiceLocator.instance) {
      ServiceLocator.instance = new ServiceLocator();
      ServiceLocator.instance.registerDefaultDependencies();
    }
    return ServiceLocator.instance;
  }

  // Реєстрація залежностей за замовчуванням
  private registerDefaultDependencies(): void {
    // Репозиторії
    this.repositories.set('ChatRepository', new PrismaChatRepository());
    this.repositories.set('MessageRepository', new PrismaMessageRepository());
    this.repositories.set('UserRepository', new PrismaUserRepository());

    // Імпортуємо сервіси динамічно, щоб уникнути циклічних залежностей
    // Оновлено: використовуємо require() замість import()
    try {
      const { ChatService } = require('@/domains/chat/application/services/chatService');
      this.services.set('ChatService', new ChatService(this.getRepository('ChatRepository')));
    } catch (error) {
      console.error('Failed to load ChatService:', error);
    }

    try {
      const { MessageService } = require('@/domains/message/application/services/messageService');
      this.services.set(
        'MessageService',
        new MessageService(
          this.getRepository('MessageRepository'),
          this.getRepository('ChatRepository')
        )
      );
    } catch (error) {
      console.error('Failed to load MessageService:', error);
    }

    try {
      const { UserService } = require('@/domains/user/application/services/userService');
      this.services.set('UserService', new UserService(this.getRepository('UserRepository')));
    } catch (error) {
      console.error('Failed to load UserService:', error);
    }
  }

  // Отримання репозиторію
  public getRepository<T>(name: string): T {
    const repository = this.repositories.get(name);
    if (!repository) {
      throw new Error(`Repository ${name} is not registered`);
    }
    return repository as T;
  }

  // Отримання сервісу
  public getService<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} is not registered`);
    }
    return service as T;
  }

  // Реєстрація репозиторію
  public registerRepository(name: string, repository: any): void {
    this.repositories.set(name, repository);
  }

  // Реєстрація сервісу
  public registerService(name: string, service: any): void {
    this.services.set(name, service);
  }
}

// Фабрична функція для створення репозиторіїв
export class RepositoryFactory {
  public static createChatRepository(): ChatRepository {
    return ServiceLocator.getInstance().getRepository<ChatRepository>('ChatRepository');
  }

  public static createMessageRepository(): MessageRepository {
    return ServiceLocator.getInstance().getRepository<MessageRepository>('MessageRepository');
  }

  public static createUserRepository(): UserRepository {
    return ServiceLocator.getInstance().getRepository<UserRepository>('UserRepository');
  }
}

// Фабрична функція для створення сервісів
export class ServiceFactory {
  public static createChatService(): any {
    return ServiceLocator.getInstance().getService('ChatService');
  }

  public static createMessageService(): any {
    return ServiceLocator.getInstance().getService('MessageService');
  }

  public static createUserService(): any {
    return ServiceLocator.getInstance().getService('UserService');
  }
}
