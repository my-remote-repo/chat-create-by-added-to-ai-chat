import { PrismaClient } from '@prisma/client';

// PrismaClient глобальний для запобігання множинним екземплярам у розробці
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Зберігаємо екземпляри в глобальному об'єкті у режимі розробки
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
