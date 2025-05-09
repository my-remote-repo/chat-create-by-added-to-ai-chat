import { prisma } from '@/lib/db';
import { Message, MessageProps } from '../../domain/entities/message';
import { File, FileProps } from '../../domain/entities/file';
import {
  MessageRepository,
  FindMessagesOptions,
} from '../../domain/repositories/messageRepository';

export class PrismaMessageRepository implements MessageRepository {
  async findById(id: string): Promise<Message | null> {
    try {
      const messageData = await prisma.message.findUnique({
        where: { id },
        include: {
          user: true,
          files: true,
          replyTo: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!messageData) {
        return null;
      }

      // Перетворення даних з Prisma в доменну модель
      const files = messageData.files.map(
        file =>
          new File({
            id: file.id,
            name: file.name,
            url: file.url,
            size: file.size,
            type: file.type,
            messageId: file.messageId,
            chatId: file.chatId,
            userId: file.userId,
            createdAt: file.createdAt,
          } as FileProps)
      );

      const replyTo = messageData.replyTo
        ? {
            id: messageData.replyTo.id,
            content: messageData.replyTo.content,
            chatId: messageData.replyTo.chatId,
            userId: messageData.replyTo.userId,
            createdAt: messageData.replyTo.createdAt,
            updatedAt: messageData.replyTo.updatedAt,
            isDeleted: messageData.replyTo.isDeleted,
            readBy: messageData.replyTo.readBy,
            user: messageData.replyTo.user
              ? {
                  id: messageData.replyTo.user.id,
                  name: messageData.replyTo.user.name,
                  image: messageData.replyTo.user.image,
                }
              : undefined,
          }
        : null;

      return new Message({
        id: messageData.id,
        content: messageData.content,
        chatId: messageData.chatId,
        userId: messageData.userId,
        replyToId: messageData.replyToId,
        createdAt: messageData.createdAt,
        updatedAt: messageData.updatedAt,
        isDeleted: messageData.isDeleted,
        readBy: messageData.readBy,
        files,
        user: messageData.user
          ? {
              id: messageData.user.id,
              name: messageData.user.name,
              image: messageData.user.image,
            }
          : undefined,
        replyTo,
      } as MessageProps);
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findMessages(options: FindMessagesOptions): Promise<Message[]> {
    const { chatId, limit = 50, before, after, cursor, includeFiles = true, searchText } = options;

    try {
      // Побудова умов пошуку
      const whereClause: any = {
        chatId,
      };

      // Фільтр за датою
      if (before) {
        whereClause.createdAt = {
          ...(whereClause.createdAt || {}),
          lt: before,
        };
      }

      if (after) {
        whereClause.createdAt = {
          ...(whereClause.createdAt || {}),
          gt: after,
        };
      }

      // Курсор для пагінації
      if (cursor) {
        whereClause.id = {
          lt: cursor, // Отримуємо повідомлення перед курсором
        };
      }

      // Пошук за текстом
      if (searchText) {
        whereClause.content = {
          contains: searchText,
          mode: 'insensitive',
        };
      }

      // Отримання повідомлень
      const messagesData = await prisma.message.findMany({
        where: whereClause,
        include: {
          user: true,
          files: includeFiles,
          replyTo: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc', // Спочатку найновіші
        },
        take: limit,
      });

      // Перетворення даних з Prisma в доменні об'єкти
      return messagesData.map(messageData => {
        const files = includeFiles
          ? messageData.files.map(
              file =>
                new File({
                  id: file.id,
                  name: file.name,
                  url: file.url,
                  size: file.size,
                  type: file.type,
                  messageId: file.messageId,
                  chatId: file.chatId,
                  userId: file.userId,
                  createdAt: file.createdAt,
                } as FileProps)
            )
          : [];

        const replyTo = messageData.replyTo
          ? {
              id: messageData.replyTo.id,
              content: messageData.replyTo.content,
              chatId: messageData.replyTo.chatId,
              userId: messageData.replyTo.userId,
              createdAt: messageData.replyTo.createdAt,
              updatedAt: messageData.replyTo.updatedAt,
              isDeleted: messageData.replyTo.isDeleted,
              readBy: messageData.replyTo.readBy,
              user: messageData.replyTo.user
                ? {
                    id: messageData.replyTo.user.id,
                    name: messageData.replyTo.user.name,
                    image: messageData.replyTo.user.image,
                  }
                : undefined,
            }
          : null;

        return new Message({
          id: messageData.id,
          content: messageData.content,
          chatId: messageData.chatId,
          userId: messageData.userId,
          replyToId: messageData.replyToId,
          createdAt: messageData.createdAt,
          updatedAt: messageData.updatedAt,
          isDeleted: messageData.isDeleted,
          readBy: messageData.readBy,
          files,
          user: messageData.user
            ? {
                id: messageData.user.id,
                name: messageData.user.name,
                image: messageData.user.image,
              }
            : undefined,
          replyTo,
        } as MessageProps);
      });
    } catch (error) {
      console.error('Error in findMessages:', error);
      return [];
    }
  }

  async findLastMessages(chatIds: string[]): Promise<Record<string, Message>> {
    try {
      // Для кожного чату знаходимо останнє повідомлення
      const lastMessagesData = await Promise.all(
        chatIds.map(async chatId => {
          const messages = await prisma.message.findMany({
            where: {
              chatId,
              isDeleted: false,
            },
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
          });

          return messages[0] ? { chatId, message: messages[0] } : null;
        })
      );

      // Формуємо мапу chatId -> Message
      const result: Record<string, Message> = {};
      lastMessagesData.forEach(item => {
        if (item && item.message) {
          result[item.chatId] = new Message({
            id: item.message.id,
            content: item.message.content,
            chatId: item.message.chatId,
            userId: item.message.userId,
            replyToId: item.message.replyToId,
            createdAt: item.message.createdAt,
            updatedAt: item.message.updatedAt,
            isDeleted: item.message.isDeleted,
            readBy: item.message.readBy,
            user: item.message.user
              ? {
                  id: item.message.user.id,
                  name: item.message.user.name,
                  image: item.message.user.image,
                }
              : undefined,
          } as MessageProps);
        }
      });

      return result;
    } catch (error) {
      console.error('Error in findLastMessages:', error);
      return {};
    }
  }

  async create(message: Message): Promise<Message> {
    try {
      const newMessage = await prisma.message.create({
        data: {
          content: message.content,
          chatId: message.chatId,
          userId: message.userId,
          replyToId: message.replyToId,
          readBy: [message.userId], // Автор повідомлення автоматично вважається таким, що прочитав його
        },
        include: {
          user: true,
        },
      });

      // Якщо повідомлення має файли, зберігаємо їх
      if (message.files.length > 0) {
        for (const file of message.files) {
          await prisma.file.create({
            data: {
              name: file.name,
              url: file.url,
              size: file.size,
              type: file.type,
              messageId: newMessage.id,
              chatId: message.chatId,
              userId: message.userId,
              // Видалено поле key, оскільки його немає в схемі
            },
          });
        }
      }

      // Оновлюємо дату останнього оновлення чату
      await prisma.chat.update({
        where: { id: message.chatId },
        data: { updatedAt: new Date() },
      });

      // Оновлюємо статистику чату
      await this.updateChatStats(message.chatId);

      // Повертаємо створене повідомлення з усіма даними
      const createdMessage = await this.findById(newMessage.id);

      if (!createdMessage) {
        throw new Error('Failed to create message');
      }

      return createdMessage;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  // Приватний метод для оновлення статистики чату
  private async updateChatStats(chatId: string): Promise<void> {
    try {
      // Підрахунок кількості повідомлень
      const messageCount = await prisma.message.count({
        where: { chatId },
      });

      // Підрахунок кількості учасників
      const participantCount = await prisma.chatParticipant.count({
        where: { chatId },
      });

      // Перевірка, чи існує запис статистики
      // Зберігаємо статистику чату як спеціальне системне повідомлення
      const statsMessage = await prisma.message.findFirst({
        where: {
          chatId,
          content: 'CHAT_STATS',
          userId: 'system',
        },
      });

      if (statsMessage) {
        // Оновлюємо існуючий запис
        await prisma.message.update({
          where: { id: statsMessage.id },
          data: {
            updatedAt: new Date(),
            // Зберігаємо статистику в полі readBy
            readBy: [`${messageCount}`, `${participantCount}`],
          },
        });
      } else {
        // Створюємо новий запис
        await prisma.message.create({
          data: {
            content: 'CHAT_STATS',
            chatId,
            userId: 'system',
            readBy: [`${messageCount}`, `${participantCount}`],
          },
        });
      }
    } catch (error) {
      console.error('Error in updateChatStats:', error);
    }
  }

  async update(message: Message): Promise<Message> {
    try {
      await prisma.message.update({
        where: { id: message.id },
        data: {
          content: message.content,
          updatedAt: new Date(),
          // Видалено поле isEdited, оскільки його немає в схемі
          // Використовуємо додаткове повідомлення для відстеження версій
        },
      });

      // Додаємо спеціальне приховане повідомлення для відстеження зміни
      await prisma.message.create({
        data: {
          content: `EDIT:${message.id}:${new Date().toISOString()}`,
          chatId: message.chatId,
          userId: message.userId,
          readBy: [message.userId],
        },
      });

      const updatedMessage = await this.findById(message.id);

      if (!updatedMessage) {
        throw new Error('Failed to update message');
      }

      return updatedMessage;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Soft delete - встановлюємо прапорець isDeleted
      const message = await prisma.message.findUnique({
        where: { id },
        select: { chatId: true, userId: true },
      });

      if (message) {
        await prisma.message.update({
          where: { id },
          data: {
            isDeleted: true,
            updatedAt: new Date(),
          },
        });

        // Додаємо спеціальне приховане повідомлення для відстеження видалення
        await prisma.message.create({
          data: {
            content: `DELETE:${id}:${new Date().toISOString()}`,
            chatId: message.chatId,
            userId: message.userId,
            readBy: [message.userId],
          },
        });
      }
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    try {
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { readBy: true },
      });

      if (message && !message.readBy.includes(userId)) {
        await prisma.message.update({
          where: { id: messageId },
          data: {
            readBy: {
              push: userId,
            },
          },
        });
      }
    } catch (error) {
      console.error('Error in markAsRead:', error);
      throw error;
    }
  }

  async markAllAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Спочатку перевіряємо, чи є повідомлення, які потрібно оновити
      const unreadMessages = await prisma.message.findMany({
        where: {
          chatId,
          NOT: {
            readBy: {
              has: userId,
            },
          },
          userId: { not: userId }, // Виключаємо повідомлення, надіслані самим користувачем
        },
        select: {
          id: true,
        },
      });

      // Якщо немає непрочитаних повідомлень, не виконуємо оновлення
      if (unreadMessages.length === 0) {
        return;
      }

      // Оновлюємо тільки ті повідомлення, які ще не були прочитані
      const messageIds = unreadMessages.map(msg => msg.id);

      // Оновлюємо повідомлення пакетно
      await prisma.message.updateMany({
        where: {
          id: { in: messageIds },
        },
        data: {
          readBy: {
            push: userId,
          },
        },
      });

      // Оновлюємо час останнього прочитання для учасника
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        data: {
          lastReadAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      throw error;
    }
  }

  async countUnread(chatId: string, userId: string): Promise<number> {
    try {
      return await prisma.message.count({
        where: {
          chatId,
          isDeleted: false,
          NOT: {
            readBy: {
              has: userId,
            },
          },
          userId: { not: userId }, // Виключаємо повідомлення, надіслані самим користувачем
        },
      });
    } catch (error) {
      console.error('Error in countUnread:', error);
      return 0;
    }
  }

  async countTotalUnread(userId: string): Promise<number> {
    try {
      // Отримуємо ID всіх чатів, в яких користувач є учасником
      const participations = await prisma.chatParticipant.findMany({
        where: { userId },
        select: { chatId: true },
      });

      const chatIds = participations.map(p => p.chatId);

      // Підраховуємо кількість непрочитаних повідомлень у всіх чатах
      return await prisma.message.count({
        where: {
          chatId: { in: chatIds },
          isDeleted: false,
          NOT: {
            readBy: {
              has: userId,
            },
          },
          userId: { not: userId }, // Виключаємо повідомлення, надіслані самим користувачем
        },
      });
    } catch (error) {
      console.error('Error in countTotalUnread:', error);
      return 0;
    }
  }

  async search(userId: string, query: string, limit: number = 20): Promise<Message[]> {
    try {
      // Отримуємо ID всіх чатів, в яких користувач є учасником
      const participations = await prisma.chatParticipant.findMany({
        where: { userId },
        select: { chatId: true },
      });

      const chatIds = participations.map(p => p.chatId);

      // Шукаємо повідомлення за запитом
      const messagesData = await prisma.message.findMany({
        where: {
          chatId: { in: chatIds },
          isDeleted: false,
          content: {
            contains: query,
            mode: 'insensitive',
          },
        },
        include: {
          user: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit,
      });

      // Перетворюємо результати в доменні об'єкти
      return messagesData.map(
        messageData =>
          new Message({
            id: messageData.id,
            content: messageData.content,
            chatId: messageData.chatId,
            userId: messageData.userId,
            replyToId: messageData.replyToId,
            createdAt: messageData.createdAt,
            updatedAt: messageData.updatedAt,
            isDeleted: messageData.isDeleted,
            readBy: messageData.readBy,
            user: messageData.user
              ? {
                  id: messageData.user.id,
                  name: messageData.user.name,
                  image: messageData.user.image,
                }
              : undefined,
          } as MessageProps)
      );
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  async saveFile(file: File): Promise<File> {
    try {
      const newFile = await prisma.file.create({
        data: {
          name: file.name,
          url: file.url,
          // Видалено поле key, оскільки його немає в схемі
          size: file.size,
          type: file.type,
          messageId: file.messageId,
          chatId: file.chatId,
          userId: file.userId,
        },
      });

      return new File({
        id: newFile.id,
        name: newFile.name,
        url: newFile.url,
        size: newFile.size,
        type: newFile.type,
        messageId: newFile.messageId,
        chatId: newFile.chatId,
        userId: newFile.userId,
        createdAt: newFile.createdAt,
      } as FileProps);
    } catch (error) {
      console.error('Error in saveFile:', error);
      throw error;
    }
  }

  async deleteFile(id: string): Promise<void> {
    try {
      await prisma.file.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in deleteFile:', error);
      throw error;
    }
  }

  async findMessageFiles(messageId: string): Promise<File[]> {
    try {
      const files = await prisma.file.findMany({
        where: { messageId },
      });

      return files.map(
        file =>
          new File({
            id: file.id,
            name: file.name,
            url: file.url,
            size: file.size,
            type: file.type,
            messageId: file.messageId,
            chatId: file.chatId,
            userId: file.userId,
            createdAt: file.createdAt,
          } as FileProps)
      );
    } catch (error) {
      console.error('Error in findMessageFiles:', error);
      return [];
    }
  }
}
