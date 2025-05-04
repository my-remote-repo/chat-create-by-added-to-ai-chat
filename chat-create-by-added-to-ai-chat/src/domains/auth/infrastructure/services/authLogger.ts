// src/domains/auth/infrastructure/services/authLogger.ts
export class AuthLogger {
  private static readonly LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG',
  };

  /**
   * Логування помилки
   */
  static error(message: string, context?: any): void {
    AuthLogger.log(AuthLogger.LOG_LEVELS.ERROR, message, context);
  }

  /**
   * Логування попередження
   */
  static warn(message: string, context?: any): void {
    AuthLogger.log(AuthLogger.LOG_LEVELS.WARN, message, context);
  }

  /**
   * Логування інформаційного повідомлення
   */
  static info(message: string, context?: any): void {
    AuthLogger.log(AuthLogger.LOG_LEVELS.INFO, message, context);
  }

  /**
   * Логування налагоджувального повідомлення
   */
  static debug(message: string, context?: any): void {
    AuthLogger.log(AuthLogger.LOG_LEVELS.DEBUG, message, context);
  }

  /**
   * Загальний метод логування
   */
  private static log(level: string, message: string, context?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      context: context || {},
    };

    // Вивід у консоль
    console.log(JSON.stringify(logEntry));

    // В реальному додатку тут можна додати логування в файл або в сервіс логування

    // TODO: Додати логування в БД для подій безпеки
    if (level === AuthLogger.LOG_LEVELS.ERROR || level === AuthLogger.LOG_LEVELS.WARN) {
      // Зберігати в БД або відправляти в сервіс моніторингу
    }
  }
}
