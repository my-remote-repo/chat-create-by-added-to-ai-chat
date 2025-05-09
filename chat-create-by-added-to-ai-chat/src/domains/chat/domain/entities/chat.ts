import { UserDTO } from '@/domains/user/domain/entities/user';
import { Participant } from './participant';

/**
 * Властивості чату
 */
export interface ChatProps {
  id: string;
  name?: string | null;
  description?: string | null;
  isGroup: boolean;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants?: Participant[];
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
  } | null;
}

/**
 * Доменна модель чату
 */
export class Chat {
  private readonly props: ChatProps;

  constructor(props: ChatProps) {
    this.props = {
      ...props,
      participants: props.participants || [],
    };
  }

  // Геттери
  get id(): string {
    return this.props.id;
  }

  get name(): string | null | undefined {
    return this.props.name;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get isGroup(): boolean {
    return this.props.isGroup;
  }

  get ownerId(): string | null | undefined {
    return this.props.ownerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get participants(): Participant[] {
    return this.props.participants || [];
  }

  get lastMessage():
    | {
        id: string;
        content: string;
        createdAt: Date;
        senderId: string;
      }
    | null
    | undefined {
    return this.props.lastMessage;
  }

  // Бізнес-методи
  public updateDetails(name?: string, description?: string): Chat {
    return new Chat({
      ...this.props,
      name: name ?? this.props.name,
      description: description ?? this.props.description,
      updatedAt: new Date(),
    });
  }

  public addParticipant(participant: Participant): Chat {
    // Перевірка, чи учасник вже є в чаті
    const exists = this.participants.some(p => p.userId === participant.userId);

    if (exists) {
      return this;
    }

    return new Chat({
      ...this.props,
      participants: [...this.participants, participant],
      updatedAt: new Date(),
    });
  }

  public removeParticipant(userId: string): Chat {
    return new Chat({
      ...this.props,
      participants: this.participants.filter(p => p.userId !== userId),
      updatedAt: new Date(),
    });
  }

  public makeAdmin(userId: string): Chat {
    const updatedParticipants = this.participants.map(participant => {
      if (participant.userId === userId) {
        return participant.makeAdmin();
      }
      return participant;
    });

    return new Chat({
      ...this.props,
      participants: updatedParticipants,
      updatedAt: new Date(),
    });
  }

  public updateLastMessage(message: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
  }): Chat {
    return new Chat({
      ...this.props,
      lastMessage: message,
      updatedAt: new Date(),
    });
  }

  // Трансформація в DTO для публічного API
  public toDTO(currentUserId?: string): ChatDTO {
    // Для особистого чату знаходимо іншого учасника для відображення імені
    let displayName = this.name;
    let otherParticipant: Participant | undefined;
    let otherUser = undefined;

    console.log('toDTO called with currentUserId:', currentUserId);
    console.log('Participants:', this.participants);

    if (!this.isGroup && currentUserId && this.participants.length === 2) {
      otherParticipant = this.participants.find(p => p.userId !== currentUserId);
      console.log('Found otherParticipant:', otherParticipant);

      if (otherParticipant) {
        if (otherParticipant.user) {
          displayName = otherParticipant.user.name;
          otherUser = otherParticipant.user.toDTO(); // ДОДАЄМО це
        } else {
          console.log('otherParticipant.user is missing!');
        }
      }
    }

    const result = {
      id: this.id,
      name: displayName || null,
      description: this.description,
      isGroup: this.isGroup,
      ownerId: this.ownerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      participants: this.participants.map(p => p.toDTO()),
      lastMessage: this.lastMessage,
      otherUser: otherUser, // Забезпечуємо наявність цього поля
    };

    console.log('Chat DTO result:', result);
    return result;
  }
}

// DTO для безпечної передачі даних через API
export interface ChatDTO {
  id: string;
  name: string | null;
  description?: string | null;
  isGroup: boolean;
  ownerId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  participants: Array<{
    userId: string;
    isAdmin: boolean;
    joinedAt: Date;
    user?: UserDTO;
  }>;
  lastMessage?: {
    id: string;
    content: string;
    createdAt: Date;
    senderId: string;
  } | null;
  otherUser?: UserDTO; // Тільки для особистих чатів
}
