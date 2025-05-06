/**
 * Доменна модель користувача
 * Представляє бізнес-правила та поведінку користувача у системі
 */
export interface UserProps {
  id: string;
  name: string;
  email: string;
  password?: string;
  image?: string | null;
  bio?: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  // Геттери для доступу до властивостей
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get image(): string | null | undefined {
    return this.props.image;
  }

  get bio(): string | null | undefined {
    return this.props.bio;
  }

  get emailVerified(): Date | null | undefined {
    return this.props.emailVerified;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Бізнес-методи
  public updateProfile(name: string, bio?: string): User {
    return new User({
      ...this.props,
      name,
      bio: bio ?? this.props.bio,
      updatedAt: new Date(),
    });
  }

  public updateAvatar(imageUrl: string): User {
    return new User({
      ...this.props,
      image: imageUrl,
      updatedAt: new Date(),
    });
  }

  public verifyEmail(): User {
    return new User({
      ...this.props,
      emailVerified: new Date(),
      updatedAt: new Date(),
    });
  }

  // Трансформація в DTO для публічного API
  public toDTO(): UserDTO {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      image: this.image,
      bio: this.bio,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// DTO (Data Transfer Object) для безпечної передачі даних через API
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  bio?: string | null;
  createdAt: Date;
  updatedAt: Date;
  status?: string; // Додаємо опціональне поле статусу
  lastSeen?: Date; // Також додаємо lastSeen для повноти
}
