// src/domains/auth/infrastructure/services/emailService.ts
import { AuthLogger } from './authLogger';

export class EmailService {
  /**
   * Відправляє листа
   */
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      // Заглушка для відправки email
      // В реальному додатку тут була б інтеграція з nodemailer або іншим сервісом
      console.log(`[EMAIL SERVICE] Sending email to ${to}, subject: ${subject}`);
      console.log(`[EMAIL SERVICE] Email content: ${html}`);

      AuthLogger.info('Email sent successfully (mock)', { to, subject });
      return true;
    } catch (error) {
      AuthLogger.error('Failed to send email', { to, subject, error });
      return false;
    }
  }

  /**
   * Відправляє лист підтвердження email
   */
  async sendVerificationEmail(to: string, name: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Вітаємо, ${name}!</h2>
        <p>Дякуємо за реєстрацію в нашому чат-додатку.</p>
        <p>Будь ласка, підтвердіть вашу електронну пошту, натиснувши на кнопку нижче:</p>
        <p style="text-align: center;">
          <a href="${verificationUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
            Підтвердити Email
          </a>
        </p>
        <p>Або перейдіть за цим посиланням: <a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Якщо ви не реєструвалися в нашому додатку, проігноруйте цей лист.</p>
        <p>З повагою,<br>Команда Chat App</p>
      </div>
    `;

    return this.sendEmail(to, 'Підтвердження електронної пошти', html);
  }

  /**
   * Відправляє лист скидання пароля
   */
  async sendPasswordResetEmail(to: string, name: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/confirm?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Привіт, ${name}!</h2>
        <p>Ви отримали цей лист тому, що хтось (сподіваємось, що це були ви) запросив скидання пароля для вашого облікового запису.</p>
        <p>Для скидання пароля натисніть на кнопку нижче:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">
            Скинути пароль
          </a>
        </p>
        <p>Або перейдіть за цим посиланням: <a href="${resetUrl}">${resetUrl}</a></p>
        <p>Якщо ви не запитували скидання пароля, проігноруйте цей лист - ваш пароль залишиться незмінним.</p>
        <p>З повагою,<br>Команда Chat App</p>
      </div>
    `;

    return this.sendEmail(to, 'Скидання пароля', html);
  }
}
