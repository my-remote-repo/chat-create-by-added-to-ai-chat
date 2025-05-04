// src/domains/auth/infrastructure/services/errorHandler.ts
import { AuthLogger } from './authLogger';

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  PASSWORD_RESET_FAILED = 'PASSWORD_RESET_FAILED',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  INVALID_TOKEN = 'INVALID_TOKEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export class AuthError extends Error {
  type: AuthErrorType;
  statusCode: number;
  details?: any;

  constructor(type: AuthErrorType, message: string, statusCode: number = 400, details?: any) {
    super(message);
    this.name = 'AuthError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class AuthErrorHandler {
  /**
   * Обробляє помилку та повертає відповідний HTTP-статус і повідомлення
   */
  static handle(error: any): { statusCode: number; message: string; type: string } {
    // Якщо це наша кастомна помилка
    if (error instanceof AuthError) {
      AuthLogger.warn(`Auth error: ${error.message}`, {
        type: error.type,
        details: error.details,
      });

      return {
        statusCode: error.statusCode,
        message: error.message,
        type: error.type,
      };
    }

    // Якщо це звичайна помилка, логуємо її і повертаємо 500
    AuthLogger.error(`Unexpected auth error: ${error.message}`, { error });

    return {
      statusCode: 500,
      message: 'An unexpected error occurred',
      type: AuthErrorType.INTERNAL_ERROR,
    };
  }

  /**
   * Створює об'єкт AuthError для невірних облікових даних
   */
  static invalidCredentials(details?: any): AuthError {
    return new AuthError(
      AuthErrorType.INVALID_CREDENTIALS,
      'Invalid email or password',
      401,
      details
    );
  }

  /**
   * Створює об'єкт AuthError для неіснуючого користувача
   */
  static userNotFound(details?: any): AuthError {
    return new AuthError(AuthErrorType.USER_NOT_FOUND, 'User not found', 404, details);
  }

  /**
   * Створює об'єкт AuthError для існуючого email
   */
  static emailAlreadyExists(details?: any): AuthError {
    return new AuthError(
      AuthErrorType.EMAIL_ALREADY_EXISTS,
      'User with this email already exists',
      409,
      details
    );
  }

  /**
   * Створює об'єкт AuthError для неверифікованого email
   */
  static emailNotVerified(details?: any): AuthError {
    return new AuthError(
      AuthErrorType.EMAIL_NOT_VERIFIED,
      'Email not verified. Please check your email for verification link.',
      403,
      details
    );
  }

  /**
   * Створює об'єкт AuthError для просроченого токена
   */
  static tokenExpired(details?: any): AuthError {
    return new AuthError(AuthErrorType.TOKEN_EXPIRED, 'Token has expired', 401, details);
  }

  /**
   * Створює об'єкт AuthError для невірного токена
   */
  static tokenInvalid(details?: any): AuthError {
    return new AuthError(AuthErrorType.TOKEN_INVALID, 'Invalid token', 401, details);
  }

  /**
   * Створює об'єкт AuthError для невдалого скидання пароля
   */
  static passwordResetFailed(details?: any): AuthError {
    return new AuthError(
      AuthErrorType.PASSWORD_RESET_FAILED,
      'Failed to reset password. Token may be invalid or expired.',
      400,
      details
    );
  }

  /**
   * Створює об'єкт AuthError для невдалої верифікації
   */
  static verificationFailed(details?: any): AuthError {
    return new AuthError(
      AuthErrorType.VERIFICATION_FAILED,
      'Verification failed. Token may be invalid or expired.',
      400,
      details
    );
  }

  /**
   * Створює об'єкт AuthError для неавторизованого доступу
   */
  static unauthorized(details?: any): AuthError {
    return new AuthError(AuthErrorType.UNAUTHORIZED, 'Unauthorized', 401, details);
  }

  /**
   * Створює об'єкт AuthError для забороненого доступу
   */
  static forbidden(details?: any): AuthError {
    return new AuthError(AuthErrorType.FORBIDDEN, 'Forbidden', 403, details);
  }

  /**
   * Створює об'єкт AuthError для занадто багатьох запитів
   */
  static tooManyRequests(details?: any): AuthError {
    return new AuthError(
      AuthErrorType.TOO_MANY_REQUESTS,
      'Too many requests. Please try again later.',
      429,
      details
    );
  }
}
