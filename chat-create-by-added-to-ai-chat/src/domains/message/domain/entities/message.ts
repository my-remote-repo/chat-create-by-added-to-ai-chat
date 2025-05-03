import { UserDTO } from "@/domains/user/domain/entities/user";
import { File, FileDTO } from "./file";

/**
 * Властивості повідомлення
 */
export interface MessageProps {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  replyToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  readBy: string[];
  files?: File[];
  user?: {
    id: string;
    name: string;
    image?: string | null;
  };
  replyTo?: MessageProps | null;
}

/**
 * Доменна модель повідомлення
 */
export class Message {
  private readonly props: MessageProps;

  constructor(props: MessageProps) {
    this.props = {
      ...props,
      isDeleted: props.isDeleted || false,
      readBy: props.readBy || [],
      files: props.files || [],
    };
  }

  // Геттери
  get id(): string {
    return this.props.id;
  }

  get content(): string {
    return this.props.isDeleted ? "Повідомлення видалено" : this.props.content;
  }

  get rawContent(): string {
    return this.props.content;
  }

  get chatId(): string {
    return this.props.chatId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get replyToId(): string | null | undefined {
    return this.props.replyToId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get isDeleted(): boolean {
    return this.props.isDeleted;
  }

  get readBy(): string[] {
    return [...this.props.readBy];
  }

  get files(): File[] {
    return this.props.files || [];
  }

  get user(): { id: string; name: string; image?: string | null } | undefined {
    return this.props.user;
  }

  get replyTo(): Message | null | undefined {
    return this.props.replyTo
      ? new Message(this.props.replyTo)
      : undefined;
  }

  // Перевірка, чи прочитане повідомлення конкретним користувачем
  public isReadBy(userId: string): boolean {
    return this.readBy.includes(userId);
  }

  // Бізнес-методи
  public markAsRead(userId: string): Message {
    if (this.isReadBy(userId)) {
      return this;
    }

    return new Message({
      ...this.props,
      readBy: [...this.readBy, userId],
    });
  }

  public edit(content: string): Message {
    if (this.isDeleted) {
      throw new Error("Cannot edit deleted message");
    }

    return new Message({
      ...this.props,
      content,
      updatedAt: new Date(),
    });
  }

  public delete(): Message {
    return new Message({
      ...this.props,
      isDeleted: true,
      updatedAt: new Date(),
    });
  }

  public addFile(file: File): Message {
    return new Message({
      ...this.props,
      files: [...this.files, file],
    });
  }

  public removeFile(fileId: string): Message {
    return new Message({
      ...this.props,
      files: this.files.filter(file => file.id !== fileId),
    });
  }

  // Трансформація в DTO для публічного API
  public toDTO(): MessageDTO {
    return {
      id: this.id,
      content: this.content,
      chatId: this.chatId,
      userId: this.userId,
      replyToId: this.replyToId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      isDeleted: this.isDeleted,
      readBy: this.readBy,
      files: this.files.map(file => file.toDTO()),
      user: this.user
        ? {
            id: this.user.id,
            name: this.user.name,
            image: this.user.image,
          }
        : undefined,
      replyTo: this.replyTo?.toDTO(),
    };
  }
}

// DTO для безпечної передачі даних через API
export interface MessageDTO {
  id: string;
  content: string;
  chatId: string;
  userId: string;
  replyToId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  readBy: string[];
  files: FileDTO[];
  user?: {
    id: string;
    name: string;
    image?: string | null;
  };
  replyTo?: MessageDTO | null;
}