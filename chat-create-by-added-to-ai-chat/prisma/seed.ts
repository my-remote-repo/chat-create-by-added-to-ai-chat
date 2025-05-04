// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Створення тестових користувачів
  const password = await hash('password123', 12);

  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      name: 'Користувач 1',
      email: 'user1@example.com',
      password,
      bio: 'Тестовий користувач 1',
      image: 'https://i.pravatar.cc/150?img=1',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      name: 'Користувач 2',
      email: 'user2@example.com',
      password,
      bio: 'Тестовий користувач 2',
      image: 'https://i.pravatar.cc/150?img=2',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'user3@example.com' },
    update: {},
    create: {
      name: 'Користувач 3',
      email: 'user3@example.com',
      password,
      bio: 'Тестовий користувач 3',
      image: 'https://i.pravatar.cc/150?img=3',
    },
  });

  console.log('Created users:', { user1, user2, user3 });

  // Створення тестових чатів
  const personalChat = await prisma.chat.create({
    data: {
      name: null, // Особисті чати зазвичай не мають назви
      isGroup: false,
      participants: {
        create: [
          {
            userId: user1.id,
            isAdmin: false,
          },
          {
            userId: user2.id,
            isAdmin: false,
          },
        ],
      },
    },
  });

  const groupChat = await prisma.chat.create({
    data: {
      name: 'Тестова група',
      description: 'Група для тестування чат-додатку',
      isGroup: true,
      ownerId: user1.id,
      participants: {
        create: [
          {
            userId: user1.id,
            isAdmin: true,
          },
          {
            userId: user2.id,
            isAdmin: false,
          },
          {
            userId: user3.id,
            isAdmin: false,
          },
        ],
      },
    },
  });

  console.log('Created chats:', { personalChat, groupChat });

  // Створення тестових повідомлень
  const message1 = await prisma.message.create({
    data: {
      content: 'Привіт! Як справи?',
      chatId: personalChat.id,
      userId: user1.id,
      readBy: [user1.id],
    },
  });

  const message2 = await prisma.message.create({
    data: {
      content: 'Все добре, дякую! А у тебе?',
      chatId: personalChat.id,
      userId: user2.id,
      readBy: [user2.id],
    },
  });

  const groupMessage1 = await prisma.message.create({
    data: {
      content: 'Вітаю всіх у групі!',
      chatId: groupChat.id,
      userId: user1.id,
      readBy: [user1.id],
    },
  });

  const groupMessage2 = await prisma.message.create({
    data: {
      content: 'Привіт команда!',
      chatId: groupChat.id,
      userId: user3.id,
      readBy: [user3.id],
    },
  });

  console.log('Created messages:', { message1, message2, groupMessage1, groupMessage2 });

  console.log('Seeding completed!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
