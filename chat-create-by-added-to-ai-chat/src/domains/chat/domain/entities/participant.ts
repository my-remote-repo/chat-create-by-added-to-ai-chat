import { User, UserDTO } from "@/domains/user/domain/entities/user";

/**
 * Властивості учасника чату
 */
export interface ParticipantProps {
  id?: string;
  chatId: string;
  userId: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastReadAt: Date;
  notificationsEnabled: boolean;
  isArchived: boolean;
  user?: User;
}

/**
 * Доменна модель учасника чату
 */
export class Participant {
  private readonly props: ParticipantProps;

  constructor(props: ParticipantProps) {
    this.props = {
      ...props,
      isAdmin: props.isAdmin || false,
      notificationsEnabled: props.notificationsEnabled !== false, // true за замовчуванням
      isArchived: props.isArchived || false,
      joinedAt: props.joinedAt || new Date(),
      lastReadAt: props.lastReadAt || new Date(),
    };
  }

  // Геттери
  get id(): string | undefined {
    return this.props.id;
  }

  get chatId(): string {
    return this.props.chatId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get isAdmin(): boolean {
    return this.props.isAdmin;
  }

  get joinedAt(): Date {
    return this.props.joinedAt;
  }

  get lastReadAt(): Date {
    return this.props.lastReadAt;
  }

  get notificationsEnabled(): boolean {
    return this.props.notificationsEnabled;
  }

  get isArchived(): boolean {
    return this.props.isArchived;
  }

  get user(): User | undefined {
    return this.props.user;
  }

  // Бізнес-методи
  public makeAdmin(): Participant {
    return new Participant({
      ...this.props,
      isAdmin: true,
    });
  }

  public removeAdmin(): Participant {
    return new Participant({
      ...this.props,
      isAdmin: false,
    });
  }

  public markAsRead(): Participant {
    return new Participant({
      ...this.props,
      lastReadAt: new Date(),
    });
  }

  public toggleNotifications(): Participant {
    return new Participant({
      ...this.props,
      notificationsEnabled: !this.props.notificationsEnabled,
    });
  }

  public toggleArchive(): Participant {
    return new Participant({
      ...this.props,
      isArchived: !this.props.isArchived,
    });
  }

  // Трансформація в DTO для публічного API
  public toDTO(): ParticipantDTO {
    return {
      userId: this.userId,
      isAdmin: this.isAdmin,
      joinedAt: this.joinedAt,
      lastReadAt: this.lastReadAt,
      notificationsEnabled: this.notificationsEnabled,
      isArchived: this.isArchived,
      user: this.user?.toDTO(),
    };
  }
}

// DTO для безпечної передачі даних через API
export interface ParticipantDTO {
  userId: string;
  isAdmin: boolean;
  joinedAt: Date;
  lastReadAt: Date;
  notificationsEnabled: boolean;
  isArchived: boolean;
  user?: UserDTO;
}