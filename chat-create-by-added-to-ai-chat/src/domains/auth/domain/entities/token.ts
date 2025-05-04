// src/domains/auth/domain/entities/token.ts
export interface TokenProps {
  id?: string;
  userId: string;
  token: string;
  type: TokenType;
  expiresAt: Date;
  createdAt: Date;
}

export enum TokenType {
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
  JWT_REFRESH = 'jwt_refresh',
  JWT_ACCESS = 'jwt_access',
}

export class Token {
  private readonly props: TokenProps;

  constructor(props: TokenProps) {
    this.props = {
      ...props,
      createdAt: props.createdAt || new Date(),
    };
  }

  get id(): string | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get token(): string {
    return this.props.token;
  }

  get type(): TokenType {
    return this.props.type;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Перевіряє чи токен дійсний (не просрочений)
   */
  isValid(): boolean {
    return this.expiresAt > new Date();
  }

  /**
   * Продовжує термін дії токена
   */
  extend(durationMs: number): Token {
    const newExpiresAt = new Date(this.expiresAt.getTime() + durationMs);

    return new Token({
      ...this.props,
      expiresAt: newExpiresAt,
    });
  }
}
