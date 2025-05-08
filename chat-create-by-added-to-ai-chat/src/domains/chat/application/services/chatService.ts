import { Chat, ChatDTO } from '../../domain/entities/chat';
import { Participant } from '../../domain/entities/participant';
import { ChatRepository } from '../../domain/repositories/chatRepository';
import { redisClient } from '@/lib/redis-client';
import { MessageRepository } from '@/domains/message/domain/repositories/messageRepository';

export class ChatService {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository
  ) {}

  /**
   * Отримати чат за ID
   */
  async getChatById(chatId: string, userId: string): Promise<ChatDTO | null> {
    const chat = await this.chatRepository.findById(chatId, true);

    if (!chat) {
      return null;
    }

    // Перевірка, чи є користувач учасником чату
    const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) {
      return null; // Користувач не має доступу до чату
    }

    // Повертаємо DTO з інформацією для поточного користувача
    return chat.toDTO(userId);
  }

  /**
   * Отримати список чатів користувача
   */
  async getUserChats(
    userId: string,
    options: {
      search?: string;
      onlyGroups?: boolean;
      onlyPersonal?: boolean;
      includeArchived?: boolean;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ChatDTO[]> {
    const chats = await this.chatRepository.findChats({
      userId,
      search: options.search,
      onlyGroups: options.onlyGroups,
      onlyPersonal: options.onlyPersonal,
      includeArchived: options.includeArchived,
      limit: options.limit,
      offset: options.offset,
    });

    // Повертаємо DTO для відображення в UI
    return chats.map(chat => chat.toDTO(userId));
  }

  /**
   * Оновити час останньої активності чату
   */
  // Виправлення методу updateLastActivity в ChatService
  async updateLastActivity(chatId: string): Promise<boolean> {
    try {
      const chat = await this.chatRepository.findById(chatId);

      if (!chat) {
        return false;
      }

      // Створюємо новий об'єкт чату з тими ж даними, але з оновленою датою
      const updatedChat = new Chat({
        id: chat.id,
        name: chat.name,
        description: chat.description,
        isGroup: chat.isGroup,
        ownerId: chat.ownerId,
        createdAt: chat.createdAt,
        updatedAt: new Date(), // Оновлюємо тільки це поле
        participants: chat.participants,
      });

      await this.chatRepository.update(updatedChat);
      return true;
    } catch (error) {
      console.error(`Error updating chat activity for chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Створити новий груповий чат
   */
  async createGroupChat(
    name: string,
    ownerId: string,
    participantIds: string[],
    description?: string
  ): Promise<ChatDTO> {
    // Перевірка унікальності імені групи
    // TODO: додати перевірку на унікальність імені в репозиторії

    // Переконуємось, що власник чату є в списку учасників
    if (!participantIds.includes(ownerId)) {
      participantIds.push(ownerId);
    }

    // Створення учасників
    const participants = participantIds.map(userId =>
      this.createParticipant(
        '', // chatId буде встановлено після створення чату
        userId,
        userId === ownerId // власник є адміністратором
      )
    );

    // Створення об'єкту чату
    const chat = new Chat({
      id: '', // буде згенеровано базою даних
      name,
      description,
      isGroup: true,
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      participants,
    });

    // Зберігаємо чат
    const createdChat = await this.chatRepository.create(chat);

    return createdChat.toDTO(ownerId);
  }

  /**
   * Створити або знайти особистий чат між двома користувачами
   */
  async createOrGetPersonalChat(userOneId: string, userTwoId: string): Promise<ChatDTO> {
    // Спочатку перевіряємо, чи існує чат між цими користувачами
    const existingChat = await this.chatRepository.findPersonalChat(userOneId, userTwoId);

    if (existingChat) {
      return existingChat.toDTO(userOneId);
    }

    // Якщо чат не існує, створюємо новий
    const participants = [
      this.createParticipant('', userOneId, false),
      this.createParticipant('', userTwoId, false),
    ];

    // Створення об'єкту чату
    const chat = new Chat({
      id: '', // буде згенеровано базою даних
      name: null, // особисті чати не мають назви
      isGroup: false,
      ownerId: null, // особисті чати не мають власника
      createdAt: new Date(),
      updatedAt: new Date(),
      participants,
    });

    // Зберігаємо чат
    const createdChat = await this.chatRepository.create(chat);

    return createdChat.toDTO(userOneId);
  }

  /**
   * Додати учасника до чату
   */
  async addParticipant(chatId: string, userId: string, addedByUserId: string): Promise<boolean> {
    // Отримуємо чат
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      return false;
    }

    // Перевіряємо, чи має користувач права додавати учасників
    const addedBy = chat.participants.find(p => p.userId === addedByUserId);
    if (!addedBy || (!addedBy.isAdmin && chat.ownerId !== addedByUserId)) {
      return false; // Недостатньо прав
    }

    // Перевіряємо, чи користувач вже є учасником
    const isAlreadyParticipant = chat.participants.some(p => p.userId === userId);
    if (isAlreadyParticipant) {
      return true; // Вже є учасником
    }

    // Додаємо учасника
    const participant = this.createParticipant(chatId, userId, false);

    await this.chatRepository.addParticipant(participant);

    // Оновлюємо статистику чату
    await this.updateChatStats(chatId);

    return true;
  }

  /**
   * Видалити учасника з чату
   */
  async removeParticipant(
    chatId: string,
    userId: string,
    removedByUserId: string
  ): Promise<boolean> {
    // Отримуємо чат
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      return false;
    }

    // Перевіряємо, чи має користувач права видаляти учасників
    const removedBy = chat.participants.find(p => p.userId === removedByUserId);
    if (
      !removedBy ||
      (!removedBy.isAdmin && chat.ownerId !== removedByUserId && removedByUserId !== userId)
    ) {
      return false; // Недостатньо прав (тільки адміни, власник або сам користувач може вийти)
    }

    // Перевіряємо, чи користувач є учасником
    const isParticipant = await this.chatRepository.isParticipant(chatId, userId);
    if (!isParticipant) {
      return false; // Не є учасником
    }

    // Видаляємо учасника
    await this.chatRepository.removeParticipant(chatId, userId);

    // Якщо видаляється власник чату, призначаємо нового власника
    if (chat.ownerId === userId) {
      // Шукаємо адміністратора
      const admin = chat.participants.find(p => p.isAdmin && p.userId !== userId);
      if (admin) {
        // Призначаємо нового власника
        const updatedChat = chat.updateDetails(chat.name || '', chat.description || '');
        await this.chatRepository.update(updatedChat);
      } else if (chat.participants.length > 1) {
        // Призначаємо першого учасника власником
        const newOwner = chat.participants.find(p => p.userId !== userId);
        if (newOwner) {
          const updatedChat = chat.updateDetails(chat.name || '', chat.description || '');
          await this.chatRepository.update(updatedChat);

          // Робимо нового власника адміністратором
          await this.makeAdmin(chatId, newOwner.userId, userId);
        }
      }
    }

    // Оновлюємо статистику чату
    await this.updateChatStats(chatId);

    // Перевіряємо кількість учасників, якщо 0 - видаляємо чат
    const participants = await this.chatRepository.findParticipants(chatId);
    if (participants.length === 0) {
      await this.chatRepository.delete(chatId);
    }

    return true;
  }

  /**
   * Зробити користувача адміністратором
   */
  async makeAdmin(chatId: string, userId: string, promotedByUserId: string): Promise<boolean> {
    // Отримуємо чат
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      return false;
    }

    // Перевіряємо, чи має користувач права призначати адміністраторів
    if (chat.ownerId !== promotedByUserId) {
      return false; // Тільки власник може призначати адміністраторів
    }

    // Отримуємо учасника
    const participant = await this.chatRepository.findParticipant(chatId, userId);
    if (!participant) {
      return false; // Не є учасником
    }

    // Якщо вже адмін, нічого не робимо
    if (participant.isAdmin) {
      return true;
    }

    // Робимо адміністратором
    const updatedParticipant = participant.makeAdmin();
    await this.chatRepository.updateParticipant(updatedParticipant);

    return true;
  }

  /**
   * Оновити деталі чату
   */
  async updateChatDetails(
    chatId: string,
    userId: string,
    updates: { name?: string; description?: string; image?: string }
  ): Promise<ChatDTO | null> {
    // Отримуємо чат
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      return null;
    }

    // Перевіряємо, чи має користувач права оновлювати чат
    const participant = chat.participants.find(p => p.userId === userId);
    if (!participant || (!participant.isAdmin && chat.ownerId !== userId)) {
      return null; // Недостатньо прав
    }

    // Оновлюємо деталі чату з відповідною перевіркою на null
    const name = updates.name !== undefined ? updates.name : chat.name || '';
    const description =
      updates.description !== undefined ? updates.description : chat.description || '';

    const updatedChat = chat.updateDetails(name, description);

    // Зберігаємо оновлений чат
    const savedChat = await this.chatRepository.update(updatedChat);

    return savedChat.toDTO(userId);
  }

  /**
   * Змінити налаштування сповіщень для чату
   */
  async toggleNotifications(chatId: string, userId: string, enabled: boolean): Promise<boolean> {
    // Отримуємо учасника
    const participant = await this.chatRepository.findParticipant(chatId, userId);

    if (!participant) {
      return false;
    }

    // Створюємо новий екземпляр замість доступу до приватного поля props
    const updatedParticipant = new Participant({
      id: participant.id,
      chatId: participant.chatId,
      userId: participant.userId,
      isAdmin: participant.isAdmin,
      joinedAt: participant.joinedAt,
      lastReadAt: participant.lastReadAt,
      isArchived: participant.isArchived,
      notificationsEnabled: enabled,
    });

    await this.chatRepository.updateParticipant(updatedParticipant);

    return true;
  }

  /**
   * Архівувати/розархівувати чат
   */
  async toggleArchive(chatId: string, userId: string, archived: boolean): Promise<boolean> {
    // Отримуємо учасника
    const participant = await this.chatRepository.findParticipant(chatId, userId);

    if (!participant) {
      return false;
    }

    // Створюємо новий екземпляр замість доступу до приватного поля props
    const updatedParticipant = new Participant({
      id: participant.id,
      chatId: participant.chatId,
      userId: participant.userId,
      isAdmin: participant.isAdmin,
      joinedAt: participant.joinedAt,
      lastReadAt: participant.lastReadAt,
      notificationsEnabled: participant.notificationsEnabled,
      isArchived: archived,
    });

    await this.chatRepository.updateParticipant(updatedParticipant);

    return true;
  }

  /**
   * Оновити статистику чату
   */
  private async updateChatStats(chatId: string): Promise<void> {
    try {
      // Підрахунок кількості учасників
      const participants = await this.chatRepository.findParticipants(chatId);

      // Зберігаємо статистику в окремому сховищі даних
      const statsData = {
        participantCount: participants.length,
        lastUpdated: new Date().toISOString(),
      };

      // Зберігаємо статистику в базі даних замість Redis
      // Це тимчасове рішення, поки не буде розширено інтерфейс RedisService
      const key = `chat:${chatId}:stats`;
      console.log(`Updating chat stats for ${key}:`, statsData);

      // У подальшому тут буде використовуватись Redis
      // await redisClient.setJson(key, statsData);
    } catch (error) {
      console.error(`Error updating chat stats for ${chatId}:`, error);
    }
  }

  /**
   * Допоміжний метод для створення об'єкту учасника
   */
  private createParticipant(chatId: string, userId: string, isAdmin: boolean): Participant {
    return new Participant({
      chatId,
      userId,
      isAdmin,
      joinedAt: new Date(),
      lastReadAt: new Date(),
      notificationsEnabled: true,
      isArchived: false, // Додано пропущене поле
    });
  }

  /**
   * Видалити чат
   */
  async deleteChat(chatId: string): Promise<boolean> {
    try {
      // Видаляємо чат
      await this.chatRepository.delete(chatId);
      return true;
    } catch (error) {
      console.error(`Error deleting chat ${chatId}:`, error);
      return false;
    }
  }

  /**
   * Отримати статистику непрочитаних повідомлень для списку чатів
   */
  async getChatUnreadCounts(chatIds: string[], userId: string): Promise<Record<string, number>> {
    const unreadCounts: Record<string, number> = {};

    // Отримуємо кількість непрочитаних повідомлень для кожного чату
    await Promise.all(
      chatIds.map(async chatId => {
        try {
          const count = await this.messageRepository.countUnread(chatId, userId);
          unreadCounts[chatId] = count;
        } catch (error) {
          console.error(`Error getting unread count for chat ${chatId}:`, error);
          unreadCounts[chatId] = 0;
        }
      })
    );

    return unreadCounts;
  }

  /**
   * Отримати загальну кількість непрочитаних повідомлень
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const messageCounts = await this.messageRepository.countTotalUnread(userId);
      return messageCounts;
    } catch (error) {
      console.error(`Error getting total unread count for user ${userId}:`, error);
      return 0;
    }
  }
}
