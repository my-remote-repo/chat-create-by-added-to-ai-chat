import { prisma } from '@/lib/db';
import { User, UserProps } from '../../domain/entities/user';
import { UserRepository } from '../../domain/repositories/userRepository';

/**
 * Prisma імплементація UserRepository
 * Відповідає за взаємодію з базою даних через Prisma ORM
 */
export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return new User(user as UserProps);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    return new User(user as UserProps);
  }

  async create(user: User): Promise<User> {
    const createdUser = await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        password: (user as any).props.password, // Доступ до приватного поля
        image: user.image,
        bio: user.bio,
        emailVerified: user.emailVerified,
      },
    });

    return new User(createdUser as UserProps);
  }

  async update(user: User): Promise<User> {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        image: user.image,
        bio: user.bio,
        emailVerified: user.emailVerified,
        updatedAt: new Date(),
      },
    });

    return new User(updatedUser as UserProps);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async searchByName(query: string, limit: number = 10): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: limit,
    });

    // Додайте явну типізацію для параметра user
    return users.map((user: any) => new User(user as UserProps));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email },
    });

    return count > 0;
  }
}
