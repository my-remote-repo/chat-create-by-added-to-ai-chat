import { prisma } from '@/lib/db';
import { Chat, ChatProps } from '../../domain/entities/chat';
import { Participant, ParticipantProps } from '../../domain/entities/participant';
import { ChatRepository, FindChatsOptions } from '../../domain/repositories/chatRepository';
import { User } from '@/domains/user/domain/entities/user';

export class PrismaChatRepository implements ChatRepository {
  async findById(id: string, includeParticipants: boolean = true): Promise<Chat | null> {
    try {
      // Перевірка, чи id є допустимим MongoDB ObjectID
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      if (!isValidObjectId) {
        console.warn(`Invalid ObjectID format: ${id}`);
        return null;
      }

      const chatData = await prisma.chat.findUnique({
        where: { id },
      });

      if (!chatData) {
        return null;
      }

      // Отримуємо учасників окремим запитом, якщо потрібно
      const participants: Participant[] = [];
      if (includeParticipants) {
        const participantsData = await prisma.chatParticipant.findMany({
          where: { chatId: id },
          include: { user: true },
        });

        // Перетворення даних Prisma в доменну модель
        for (const partData of participantsData) {
          participants.push(
            new Participant({
              id: partData.id,
              chatId: partData.chatId,
              userId: partData.userId,
              isAdmin: partData.isAdmin,
              joinedAt: partData.joinedAt,
              lastReadAt: partData.lastReadAt,
              notificationsEnabled: partData.notificationsEnabled,
              isArchived: partData.isArchived,
              user: partData.user
                ? new User({
                    id: partData.user.id,
                    name: partData.user.name,
                    email: partData.user.email,
                    createdAt: partData.user.createdAt,
                    updatedAt: partData.user.updatedAt,
                    image: partData.user.image,
                    bio: partData.user.bio,
                  })
                : undefined,
            })
          );
        }
      }

      return new Chat({
        id: chatData.id,
        name: chatData.name,
        description: chatData.description,
        isGroup: chatData.isGroup,
        ownerId: chatData.ownerId,
        createdAt: chatData.createdAt,
        updatedAt: chatData.updatedAt,
        participants,
      });
    } catch (error) {
      console.error('Error in findById:', error);
      return null;
    }
  }

  async findChats(options: FindChatsOptions): Promise<Chat[]> {
    const {
      userId,
      limit = 20,
      offset = 0,
      search,
      onlyGroups,
      onlyPersonal,
      includeArchived,
    } = options;

    // Побудова фільтрів для запиту
    const whereClause: any = {
      participants: {
        some: {
          userId,
          // Якщо includeArchived = false, виключаємо архівовані чати
          ...(includeArchived ? {} : { isArchived: false }),
        },
      },
    };

    // Додаємо фільтр за групою/особистим чатом
    if (onlyGroups) {
      whereClause.isGroup = true;
    } else if (onlyPersonal) {
      whereClause.isGroup = false;
    }

    // Додаємо пошук за назвою
    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    try {
      // Отримуємо список чатів з бази даних
      const chats = await prisma.chat.findMany({
        where: whereClause,
        take: limit,
        skip: offset,
        orderBy: {
          updatedAt: 'desc',
        },
      });

      // Отримуємо учасників для кожного чату
      const chatIds = chats.map(chat => chat.id);
      const participants = await prisma.chatParticipant.findMany({
        where: {
          chatId: { in: chatIds },
        },
        include: {
          user: true,
        },
      });

      // Отримуємо останні повідомлення для кожного чату
      const lastMessages = await prisma.message.findMany({
        where: {
          chatId: { in: chatIds },
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        distinct: ['chatId'],
        select: {
          id: true,
          content: true,
          chatId: true,
          createdAt: true,
          userId: true,
        },
      });

      // Групуємо учасників по chatId
      const participantsByChat: Record<string, Participant[]> = {};
      participants.forEach(p => {
        if (!participantsByChat[p.chatId]) {
          participantsByChat[p.chatId] = [];
        }

        participantsByChat[p.chatId].push(
          new Participant({
            id: p.id,
            chatId: p.chatId,
            userId: p.userId,
            isAdmin: p.isAdmin,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            notificationsEnabled: p.notificationsEnabled,
            isArchived: p.isArchived,
            user: p.user
              ? new User({
                  id: p.user.id,
                  name: p.user.name,
                  email: p.user.email,
                  createdAt: p.user.createdAt,
                  updatedAt: p.user.updatedAt,
                  image: p.user.image,
                  bio: p.user.bio,
                })
              : undefined,
          })
        );
      });

      // Групуємо останні повідомлення по chatId
      const lastMessagesByChat: Record<string, any> = {};
      lastMessages.forEach(msg => {
        lastMessagesByChat[msg.chatId] = {
          id: msg.id,
          content: msg.content,
          createdAt: msg.createdAt,
          senderId: msg.userId,
        };
      });

      // Мапимо результати в доменні об'єкти
      return chats.map(chatData => {
        return new Chat({
          id: chatData.id,
          name: chatData.name,
          description: chatData.description,
          isGroup: chatData.isGroup,
          ownerId: chatData.ownerId,
          createdAt: chatData.createdAt,
          updatedAt: chatData.updatedAt,
          participants: participantsByChat[chatData.id] || [],
          lastMessage: lastMessagesByChat[chatData.id] || null,
        });
      });
    } catch (error) {
      console.error('Error in findChats:', error);
      return [];
    }
  }

  async create(chat: Chat): Promise<Chat> {
    try {
      const newChat = await prisma.chat.create({
        data: {
          name: chat.name,
          description: chat.description,
          isGroup: chat.isGroup,
          ownerId: chat.ownerId,
          // Видалено поле image, оскільки його немає в схемі
        },
      });

      // Додаємо учасників, якщо вони вказані
      if (chat.participants.length > 0) {
        for (const participant of chat.participants) {
          await prisma.chatParticipant.create({
            data: {
              chatId: newChat.id,
              userId: participant.userId,
              isAdmin: participant.isAdmin,
              notificationsEnabled: participant.notificationsEnabled,
              isArchived: participant.isArchived,
            },
          });
        }
      }

      // Отримуємо створений чат з усіма учасниками
      const createdChat = await this.findById(newChat.id);

      if (!createdChat) {
        throw new Error('Failed to create chat');
      }

      return createdChat;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  async update(chat: Chat): Promise<Chat> {
    try {
      await prisma.chat.update({
        where: { id: chat.id },
        data: {
          name: chat.name,
          description: chat.description,
          updatedAt: new Date(),
        },
      });

      const updatedChat = await this.findById(chat.id);

      if (!updatedChat) {
        throw new Error('Failed to update chat');
      }

      return updatedChat;
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Спочатку видаляємо учасників чату
      await prisma.chatParticipant.deleteMany({
        where: { chatId: id },
      });

      // Видаляємо повідомлення чату
      await prisma.message.deleteMany({
        where: { chatId: id },
      });

      // Потім видаляємо сам чат
      await prisma.chat.delete({
        where: { id },
      });
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  async addParticipant(participant: Participant): Promise<void> {
    try {
      await prisma.chatParticipant.create({
        data: {
          chatId: participant.chatId,
          userId: participant.userId,
          isAdmin: participant.isAdmin,
          notificationsEnabled: participant.notificationsEnabled,
          isArchived: participant.isArchived,
        },
      });
    } catch (error) {
      console.error('Error in addParticipant:', error);
      throw error;
    }
  }

  async removeParticipant(chatId: string, userId: string): Promise<void> {
    try {
      await prisma.chatParticipant.delete({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
      });
    } catch (error) {
      console.error('Error in removeParticipant:', error);
      throw error;
    }
  }

  async updateParticipant(participant: Participant): Promise<void> {
    try {
      await prisma.chatParticipant.update({
        where: {
          chatId_userId: {
            chatId: participant.chatId,
            userId: participant.userId,
          },
        },
        data: {
          isAdmin: participant.isAdmin,
          lastReadAt: participant.lastReadAt,
          notificationsEnabled: participant.notificationsEnabled,
          isArchived: participant.isArchived,
          // Видалено поле nickname, оскільки його немає в схемі
        },
      });
    } catch (error) {
      console.error('Error in updateParticipant:', error);
      throw error;
    }
  }

  async findParticipant(chatId: string, userId: string): Promise<Participant | null> {
    try {
      const participant = await prisma.chatParticipant.findUnique({
        where: {
          chatId_userId: {
            chatId,
            userId,
          },
        },
        include: {
          user: true,
        },
      });

      if (!participant) {
        return null;
      }

      return new Participant({
        id: participant.id,
        chatId: participant.chatId,
        userId: participant.userId,
        isAdmin: participant.isAdmin,
        joinedAt: participant.joinedAt,
        lastReadAt: participant.lastReadAt,
        notificationsEnabled: participant.notificationsEnabled,
        isArchived: participant.isArchived,
        user: participant.user
          ? new User({
              id: participant.user.id,
              name: participant.user.name,
              email: participant.user.email,
              createdAt: participant.user.createdAt,
              updatedAt: participant.user.updatedAt,
              image: participant.user.image,
              bio: participant.user.bio,
            })
          : undefined,
      });
    } catch (error) {
      console.error('Error in findParticipant:', error);
      return null;
    }
  }

  async findParticipants(chatId: string): Promise<Participant[]> {
    try {
      const participants = await prisma.chatParticipant.findMany({
        where: { chatId },
        include: {
          user: true,
        },
      });

      return participants.map(
        p =>
          new Participant({
            id: p.id,
            chatId: p.chatId,
            userId: p.userId,
            isAdmin: p.isAdmin,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            notificationsEnabled: p.notificationsEnabled,
            isArchived: p.isArchived,
            user: p.user
              ? new User({
                  id: p.user.id,
                  name: p.user.name,
                  email: p.user.email,
                  createdAt: p.user.createdAt,
                  updatedAt: p.user.updatedAt,
                  image: p.user.image,
                  bio: p.user.bio,
                })
              : undefined,
          })
      );
    } catch (error) {
      console.error('Error in findParticipants:', error);
      return [];
    }
  }

  async isParticipant(chatId: string, userId: string): Promise<boolean> {
    try {
      const count = await prisma.chatParticipant.count({
        where: {
          chatId,
          userId,
        },
      });

      return count > 0;
    } catch (error) {
      console.error('Error in isParticipant:', error);
      return false;
    }
  }

  async findPersonalChat(userOneId: string, userTwoId: string): Promise<Chat | null> {
    try {
      // Шукаємо неgroup чат, де обидва користувачі є учасниками
      // Спочатку знаходимо всі чати userOneId
      const userOneChats = await prisma.chatParticipant.findMany({
        where: { userId: userOneId },
        select: { chatId: true },
      });

      const userOneChatIds = userOneChats.map(c => c.chatId);

      // Тепер знаходимо всі неgroup чати, де userTwoId є учасником та які є в userOneChatIds
      const personalChats = await prisma.chat.findMany({
        where: {
          id: { in: userOneChatIds },
          isGroup: false,
          participants: {
            some: {
              userId: userTwoId,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      });

      // Перевіряємо, чи знайдено чат який містить рівно двох учасників
      const personalChat = personalChats.find(chat => chat.participants.length === 2);

      if (!personalChat) {
        return null;
      }

      const participants = personalChat.participants.map(
        p =>
          new Participant({
            id: p.id,
            chatId: p.chatId,
            userId: p.userId,
            isAdmin: p.isAdmin,
            joinedAt: p.joinedAt,
            lastReadAt: p.lastReadAt,
            notificationsEnabled: p.notificationsEnabled,
            isArchived: p.isArchived,
            user: p.user
              ? new User({
                  id: p.user.id,
                  name: p.user.name,
                  email: p.user.email,
                  createdAt: p.user.createdAt,
                  updatedAt: p.user.updatedAt,
                  image: p.user.image,
                  bio: p.user.bio,
                })
              : undefined,
          })
      );

      return new Chat({
        id: personalChat.id,
        name: personalChat.name,
        description: personalChat.description,
        isGroup: personalChat.isGroup,
        ownerId: personalChat.ownerId,
        createdAt: personalChat.createdAt,
        updatedAt: personalChat.updatedAt,
        participants,
      });
    } catch (error) {
      console.error('Error in findPersonalChat:', error);
      return null;
    }
  }
}
