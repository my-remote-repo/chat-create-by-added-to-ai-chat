import { v4 as uuidv4 } from 'uuid';
import { prisma } from './db';

/**
 * Генерує CSRF-токен
 */
export async function generateCSRFToken(): Promise<string> {
  const token = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');

  // Зберігаємо токен і час створення в сесії
  // В цьому прикладі використовуємо модель Session
  await prisma.session.create({
    data: {
      sessionToken: `csrf:${token}`,
      userId: 'system',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 години
    },
  });

  return token;
}

/**
 * Перевіряє CSRF-токен
 */
export async function validateCSRFToken(token?: string | null): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    // Шукаємо токен в сесіях
    const storedToken = await prisma.session.findFirst({
      where: {
        sessionToken: `csrf:${token}`,
      },
    });

    if (!storedToken) {
      return false;
    }

    // Перевіряємо чи токен не просрочений
    if (storedToken.expires < new Date()) {
      // Видаляємо прострочений токен
      await prisma.session.delete({
        where: { id: storedToken.id },
      });
      return false;
    }

    // Видаляємо використаний токен (one-time use)
    await prisma.session.delete({
      where: { id: storedToken.id },
    });

    return true;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}
