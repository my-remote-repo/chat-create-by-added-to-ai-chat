This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

структура папок проєкту

next-ddd-chat/
├── prisma/
│ └── schema.prisma
├── public/
│ ├── favicon.ico
│ └── images/
├── src/
│ ├── app/
│ │ ├── (auth)/
│ │ │ ├── login/
│ │ │ │ └── page.tsx
│ │ │ ├── register/
│ │ │ │ └── page.tsx
│ │ │ └── layout.tsx
│ │ ├── (main)/
│ │ │ ├── chat/
│ │ │ │ ├── [chatId]/
│ │ │ │ │ └── page.tsx
│ │ │ │ └── page.tsx
│ │ │ ├── profile/
│ │ │ │ └── page.tsx
│ │ │ └── layout.tsx
│ │ ├── api/
│ │ │ ├── auth/
│ │ │ │ └── [...nextauth]/
│ │ │ │ └── route.ts
│ │ │ ├── chat/
│ │ │ │ └── route.ts
│ │ │ ├── message/
│ │ │ │ └── route.ts
│ │ │ ├── upload/
│ │ │ │ └── route.ts
│ │ │ └── webhook/
│ │ │ └── route.ts
│ │ ├── embed/
│ │ │ └── page.tsx
│ │ ├── favicon.ico
│ │ ├── globals.css
│ │ ├── layout.tsx
│ │ └── page.tsx
│ ├── domains/
│ │ ├── auth/
│ │ │ ├── application/
│ │ │ │ ├── services/
│ │ │ │ │ └── authService.ts
│ │ │ │ └── useCases/
│ │ │ │ ├── loginUseCase.ts
│ │ │ │ └── registerUseCase.ts
│ │ │ ├── domain/
│ │ │ │ ├── entities/
│ │ │ │ │ └── authUser.ts
│ │ │ │ └── repositories/
│ │ │ │ └── authRepository.ts
│ │ │ ├── infrastructure/
│ │ │ │ ├── repositories/
│ │ │ │ │ └── prismaAuthRepository.ts
│ │ │ │ └── services/
│ │ │ │ └── nextAuthAdapter.ts
│ │ │ └── presentation/
│ │ │ ├── components/
│ │ │ │ ├── LoginForm.tsx
│ │ │ │ └── RegisterForm.tsx
│ │ │ ├── hooks/
│ │ │ │ └── useAuth.ts
│ │ │ └── providers/
│ │ │ └── AuthProvider.tsx
│ │ ├── chat/
│ │ │ ├── application/
│ │ │ │ ├── services/
│ │ │ │ │ └── chatService.ts
│ │ │ │ └── useCases/
│ │ │ │ ├── createChatUseCase.ts
│ │ │ │ └── getChatListUseCase.ts
│ │ │ ├── domain/
│ │ │ │ ├── entities/
│ │ │ │ │ ├── chat.ts
│ │ │ │ │ └── participant.ts
│ │ │ │ └── repositories/
│ │ │ │ └── chatRepository.ts
│ │ │ ├── infrastructure/
│ │ │ │ ├── repositories/
│ │ │ │ │ └── prismaChatRepository.ts
│ │ │ │ └── services/
│ │ │ │ └── socketService.ts
│ │ │ └── presentation/
│ │ │ ├── components/
│ │ │ │ ├── ChatList.tsx
│ │ │ │ └── ChatRoom.tsx
│ │ │ ├── hooks/
│ │ │ │ └── useChat.ts
│ │ │ └── providers/
│ │ │ └── ChatProvider.tsx
│ │ ├── message/
│ │ │ ├── application/
│ │ │ │ ├── services/
│ │ │ │ │ └── messageService.ts
│ │ │ │ └── useCases/
│ │ │ │ ├── createMessageUseCase.ts
│ │ │ │ └── getMessageListUseCase.ts
│ │ │ ├── domain/
│ │ │ │ ├── entities/
│ │ │ │ │ ├── file.ts
│ │ │ │ │ └── message.ts
│ │ │ │ └── repositories/
│ │ │ │ └── messageRepository.ts
│ │ │ ├── infrastructure/
│ │ │ │ ├── repositories/
│ │ │ │ │ └── prismaMessageRepository.ts
│ │ │ │ └── services/
│ │ │ │ └── fileUploadService.ts
│ │ │ └── presentation/
│ │ │ ├── components/
│ │ │ │ ├── MessageInput.tsx
│ │ │ │ └── MessageList.tsx
│ │ │ ├── hooks/
│ │ │ │ └── useMessages.ts
│ │ │ └── providers/
│ │ │ └── MessageProvider.tsx
│ │ ├── notification/
│ │ │ ├── application/
│ │ │ │ ├── services/
│ │ │ │ │ └── notificationService.ts
│ │ │ │ └── useCases/
│ │ │ │ └── sendNotificationUseCase.ts
│ │ │ ├── domain/
│ │ │ │ ├── entities/
│ │ │ │ │ └── notification.ts
│ │ │ │ └── repositories/
│ │ │ │ └── notificationRepository.ts
│ │ │ ├── infrastructure/
│ │ │ │ ├── repositories/
│ │ │ │ │ └── prismaNotificationRepository.ts
│ │ │ │ └── services/
│ │ │ │ └── webPushService.ts
│ │ │ └── presentation/
│ │ │ ├── components/
│ │ │ │ └── NotificationList.tsx
│ │ │ └── hooks/
│ │ │ └── useNotifications.ts
│ │ ├── user/
│ │ │ ├── application/
│ │ │ │ ├── services/
│ │ │ │ │ └── userService.ts
│ │ │ │ └── useCases/
│ │ │ │ ├── getUserProfileUseCase.ts
│ │ │ │ └── updateUserProfileUseCase.ts
│ │ │ ├── domain/
│ │ │ │ ├── entities/
│ │ │ │ │ └── user.ts
│ │ │ │ └── repositories/
│ │ │ │ └── userRepository.ts
│ │ │ ├── infrastructure/
│ │ │ │ ├── repositories/
│ │ │ │ │ └── prismaUserRepository.ts
│ │ │ │ └── services/
│ │ │ │ └── avatarService.ts
│ │ │ └── presentation/
│ │ │ ├── components/
│ │ │ │ ├── Avatar.tsx
│ │ │ │ └── ProfileForm.tsx
│ │ │ ├── hooks/
│ │ │ │ └── useUser.ts
│ │ │ └── providers/
│ │ │ └── UserProvider.tsx
│ │ └── embed/
│ │ ├── application/
│ │ │ ├── services/
│ │ │ │ └── embedService.ts
│ │ │ └── useCases/
│ │ │ └── generateEmbedCodeUseCase.ts
│ │ ├── domain/
│ │ │ ├── entities/
│ │ │ │ └── embedConfig.ts
│ │ │ └── repositories/
│ │ │ └── embedRepository.ts
│ │ ├── infrastructure/
│ │ │ ├── repositories/
│ │ │ │ └── prismaEmbedRepository.ts
│ │ │ └── services/
│ │ │ └── tokenService.ts
│ │ └── presentation/
│ │ ├── components/
│ │ │ ├── EmbedChat.tsx
│ │ │ └── EmbedGenerator.tsx
│ │ └── hooks/
│ │ └── useEmbed.ts
│ ├── lib/
│ │ ├── auth.ts
│ │ ├── db.ts
│ │ ├── socket.ts
│ │ └── utils.ts
│ └── shared/
│ ├── components/
│ │ ├── ui/
│ │ │ ├── button.tsx
│ │ │ ├── input.tsx
│ │ │ └── ...
│ │ ├── layouts/
│ │ │ ├── MainLayout.tsx
│ │ │ └── AuthLayout.tsx
│ │ └── common/
│ │ ├── Header.tsx
│ │ └── Footer.tsx
│ ├── hooks/
│ │ ├── useLocalStorage.ts
│ │ └── useMediaQuery.ts
│ ├── providers/
│ │ └── ThemeProvider.tsx
│ ├── types/
│ │ ├── next-auth.d.ts
│ │ └── index.ts
│ └── utils/
│ ├── formatDate.ts
│ └── validation.ts
├── .env
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── tsconfig.json

Резюме реалізації API для аутентифікації
Створені компоненти та виправлення
Основні API ендпоінти для аутентифікації:

/api/auth/register - реєстрація нових користувачів
/api/auth/login - вхід у систему
/api/auth/me - отримання інформації про поточного користувача
/api/auth/reset-password - запит на скидання пароля
/api/auth/reset-password/confirm - підтвердження скидання пароля
/api/auth/verify-email - підтвердження електронної пошти
/api/auth/refresh-token - оновлення токена авторизації
/api/auth/logout - вихід із системи

JWT автентифікація:

Сервіс JwtService для роботи з JWT токенами
Механізм автоматичного оновлення токенів через refresh token
Збереження refresh токенів у базі даних

Валідація та безпека:

Валідація запитів за допомогою Zod
Хешування паролів за допомогою bcrypt
Механізм захисту від CSRF-атак
Механізм захисту від brute-force (rate-limiting)

Email і верифікація:

Заглушка EmailService для емуляції відправки листів
Механізм підтвердження email через токени у базі даних
Механізм скидання пароля через токени

Middleware для захисту маршрутів:

Захист API ендпоінтів та сторінок
Перевірка токенів авторизації
Управління доступом на основі ролей

Клієнтська частина:

Кастомний AuthProvider з повним циклом автентифікації
Хук useAuth для доступу до функцій автентифікації
Хук useAuthFetch для автоматичного оновлення токенів при запитах

Тимчасові заглушки та виправлення:

Заглушка для Redis (MockRedisService)
Створення відсутніх файлів (MessageService тощо)
Оновлення DependencyInjection.ts для обробки відсутніх залежностей

Відмова від NextAuth.js на користь власної реалізації
Причини:

Повна відповідність DDD архітектурі (автентифікація як важливий домен)
Повний контроль над життєвим циклом токенів
Краща інтеграція з існуючою доменною моделлю
Можливість кастомізації процесів автентифікації
Легке розширення для додаткових функцій безпеки

Реалізовані зміни:

Видалено стандартний механізм автентифікації NextAuth.js
Створено власну імплементацію автентифікації
Оновлено AuthProvider для роботи з токенами
Доданий ендпоінт /api/auth/me для отримання інформації про користувача
Оновлено middleware для роботи з власними JWT токенами
Реалізовано механізм оновлення токенів через useAuthFetch

Причини використання заглушок
Redis заглушка:

Щоб уникнути залежності від Redis для базового тестування аутентифікації
Зберігає дані в пам'яті замість використання зовнішньої бази даних

MessageService та інші заглушки:

Next.js виконує статичний аналіз імпортів
Потрібні реальні файли, навіть якщо код захищений try/catch
Дозволяє тестувати модуль аутентифікації без реалізації усього додатку

DependencyInjection модифікації:

Забезпечує стійкість системи до відсутніх компонентів
Дозволяє тестувати частини системи окремо

Як зняти заглушки
Redis заглушка:

Запустити справжній Redis сервер (через Docker або локально)
У файлі src/lib/redis-client.ts замінити імпорт MockRedisService на справжню реалізацію:
typescript// Замість
import { redisClient } from '@/lib/mock-redis-client';
// Використовувати
import { redisClient } from '@/lib/redis-client';

MessageService та інші заглушки:

Реалізувати повноцінні версії сервісів та репозиторіїв
Замінити логіку заглушок на реальні реалізації

DependencyInjection.ts:

Після реалізації всіх сервісів видалити блоки заглушок:
typescripttry {
const { MessageService } = require('@/domains/message/application/services/messageService');
this.services.set('MessageService', /_ ... _/);
} catch (error) {
// Видалити цей блок після реалізації MessageService
console.error('Failed to load MessageService:', error);
this.services.set('MessageService', { /_ ... _/ });
}

API ендпоінти та тестування

1. Реєстрація

URL: http://localhost:3000/api/auth/register
Метод: POST
Тіло запиту:
json{
"name": "Test User",
"email": "test@example.com",
"password": "Password123",
"confirmPassword": "Password123"
}

Очікувана відповідь: 201 Created з об'єктом користувача та токеном підтвердження (у режимі розробки)

2. Підтвердження email

URL: http://localhost:3000/api/auth/verify-email?token=ваш*токен*підтвердження
Метод: GET
Очікувана відповідь: Перенаправлення на сторінку успішної верифікації

3. Логін

URL: http://localhost:3000/api/auth/login
Метод: POST
Тіло запиту:
json{
"email": "test@example.com",
"password": "Password123"
}

Очікувана відповідь: 200 OK з токенами і даними користувача

4. Отримання інформації про користувача

URL: http://localhost:3000/api/auth/me
Метод: GET
Заголовки: Authorization: Bearer ваш*access*токен
Очікувана відповідь: 200 OK з інформацією про користувача

5. Запит на скидання пароля

URL: http://localhost:3000/api/auth/reset-password
Метод: POST
Тіло запиту:
json{
"email": "test@example.com"
}

Очікувана відповідь: 200 OK з повідомленням

6. Підтвердження скидання пароля

URL: http://localhost:3000/api/auth/reset-password/confirm
Метод: POST
Тіло запиту:
json{
"token": "ваш*токен*скидання_пароля",
"password": "NewPassword123",
"confirmPassword": "NewPassword123"
}

Очікувана відповідь: 200 OK з повідомленням

7. Оновлення токена

URL: http://localhost:3000/api/auth/refresh-token
Метод: POST
Тіло запиту:
json{
"refreshToken": "ваш*рефреш*токен"
}

Очікувана відповідь: 200 OK з новим access токеном

8. Вихід із системи

URL: http://localhost:3000/api/auth/logout
Метод: POST
Заголовки: Authorization: Bearer ваш*access*токен
Очікувана відповідь: 200 OK з повідомленням

Процес тестування
Використання Postman:

Створіть колекцію для всіх ендпоінтів
Встановіть змінні середовища для збереження токенів

Послідовність тестування:

Реєстрація → отримання токена підтвердження (у консолі)
Підтвердження email
Логін → отримання access і refresh токенів
Отримання інформації про користувача
Перевірка захищених ендпоінтів з access токеном
Оновлення токенів при потребі
Вихід із системи

Тестування скидання пароля:

Запит на скидання пароля
Отримання токена скидання (у консолі)
Підтвердження скидання пароля з новим паролем
Логін з новим паролем

Тестування захисту:

Спроба доступу до захищених ендпоінтів без токена
Спроба доступу з недійсним токеном
Спроба доступу після виходу з системи

Подальші кроки

Прибрати заглушки:

Реалізувати повноцінний EmailService для відправки листів
Замінити MockRedisService на справжню імплементацію
Завершити реалізацію відсутніх сервісів

Розширення функціоналу:

Додати двофакторну автентифікацію
Реалізувати соціальну автентифікацію
Додати більш детальне керування ролями

Покращення безпеки:

Додати детальніше логування подій безпеки
Реалізувати виявлення підозрілої активності
Додати обмеження за IP та геолокацією

Покращення UX/UI:

Розширити клієнтську частину для автентифікації
Додати сторінки для управління профілем
Реалізувати сесійний менеджмент для користувачів

Ці інструкції дозволять вам повністю протестувати реалізовану систему аутентифікації та в майбутньому правильно інтегрувати її з рештою вашого додатку.

ОНОВЛЕНО:
Реалізація системи авторизації з використанням JWT та Redis для чорного списку токенів
Функціональність системи
JWT Авторизація

Повний цикл автентифікації: реєстрація, логін, логаут, оновлення токенів
Access та Refresh токени з різним терміном дії
Безпечне зберігання у localStorage/cookies
Автоматичне оновлення токенів через refresh токен

Redis для сесій та чорного списку

Зберігання статусів користувачів (online/offline)
Чорний список анульованих токенів
Відстеження сесій користувачів
Відстеження процесу набору тексту в чаті

Чорний список токенів

Автоматичне додавання токенів до чорного списку при логауті
Перевірка кожного запиту на наявність токена в чорному списку
Автоматичне видалення токенів із чорного списку після закінчення їх терміну дії

API Ендпоінти
Автентифікація

POST /api/auth/register - реєстрація нових користувачів
POST /api/auth/login - вхід у систему
POST /api/auth/logout - вихід із системи (додає токен до чорного списку)
GET /api/auth/me - отримання інформації про поточного користувача
POST /api/auth/refresh-token - оновлення токена
GET /api/auth/verify-email - підтвердження електронної пошти
POST /api/auth/reset-password - запит на скидання пароля
POST /api/auth/reset-password/confirm - підтвердження скидання пароля

Управління чорним списком

GET /api/auth/blacklist - інформація про чорний список токенів
POST /api/auth/blacklist - додавання токена до чорного списку
PUT /api/auth/blacklist - перевірка, чи токен у чорному списку

Як працює логаут

Клієнт відправляє запит на /api/auth/logout з access токеном
Сервер:

Додає токен до чорного списку в Redis з терміном життя, рівним залишковому терміну дії токена
Видаляє сесію з бази даних
Оновлює статус користувача на "offline"

Клієнт видаляє токени з localStorage
Наступні запити з цим токеном будуть відхилені через перевірку чорного списку

Додавання перевірки чорного списку до API ендпоінтів
Для додавання перевірки чорного списку до будь-якого захищеного API ендпоінту, додайте наступний код після отримання та перед перевіркою токена:
typescript// Отримання токена авторизації
const authHeader = req.headers.get('authorization');
const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

if (!token) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Перевірка чорного списку
const isBlacklisted = await redisClient.isBlacklisted(token);
if (isBlacklisted) {
return NextResponse.json({ error: 'Token revoked' }, { status: 401 });
}

// Далі звичайна перевірка JWT токена
// ...
Технічні деталі

Зберігання в Redis: Токени зберігаються з префіксом blacklist:token: та терміном життя, рівним залишковому терміну дії токена
Автоматичне очищення: Redis автоматично видаляє ключі після закінчення терміну їх дії, що гарантує оптимальне використання пам'яті
Швидкий доступ: Перевірка в Redis відбувається за O(1), що забезпечує мінімальну затримку при перевірці токенів

Переваги реалізації

Безпека: Навіть вкрадений токен буде недійсним після логауту
Гнучкість: Можливість анулювати окремі токени або всі токени користувача
Масштабованість: Redis ефективно працює під високим навантаженням
Низька латентність: Швидка перевірка токенів не уповільнює відповіді API

Ця система забезпечує надійну автентифікацію та авторизацію користувачів з підтримкою моментального анулювання токенів при логауті або підозрілій активності.
