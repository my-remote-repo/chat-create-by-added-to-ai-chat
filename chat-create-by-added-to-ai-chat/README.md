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

======================================================================================================

Система автентифікації в Next.js DDD Chat
Загальний огляд архітектури
Система автентифікації у Next.js DDD Chat побудована за принципами Domain-Driven Design (DDD) з чітким розділенням відповідальності між серверною та клієнтською частинами. Ця архітектура забезпечує високий рівень безпеки та зручний користувацький досвід.
Ключові компоненти

AuthProvider - центральний компонент, що керує станом автентифікації
Middleware - серверний компонент для перевірки автентифікації запитів
JWT Tokens - механізм токенів для автентифікації (access і refresh)
Secure Storage - зберігання токенів у localStorage та cookies
API Routes - ендпоінти для авторизаційних операцій
HOC та Hooks - утиліти для захисту клієнтських маршрутів

Процес автентифікації в деталях

1.  Вхід користувача (Login)
    Процес входу включає:
    typescriptconst login = async (email: string, password: string) => {
    try {
    // 1. Відправка облікових даних на сервер
    const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error || 'Помилка входу в систему' };
        }

        // 2. Отримання та зберігання токенів
        localStorage.setItem('accessToken', data.tokens.accessToken);  // Для клієнтських запитів
        localStorage.setItem('refreshToken', data.tokens.refreshToken); // Для оновлення сесії

        // 3. Генерація CSRF токена для захисту від CSRF атак
        generateCsrfToken();

        // 4. Зберігання accessToken у cookie для middleware (серверна автентифікація)
        document.cookie = `accessToken=${data.tokens.accessToken}; path=/; max-age=86400; samesite=strict`;

        // 5. Оновлення стану користувача в контексті React
        setUser(data.user);

        return { success: true };

    } catch (error) {
    console.error('Помилка при вході:', error);
    return { success: false, error: 'Сталася помилка під час входу в систему' };
    }
    };
    Важливі аспекти:

Токени зберігаються в двох місцях:

localStorage для клієнтських запитів через JavaScript
cookies для серверних запитів через middleware

Використовується samesite=strict для cookies, щоб запобігти CSRF атакам
Генерується CSRF токен для додаткового захисту важливих операцій

2. Захист маршрутів (Route Protection)
   Серверний захист через Middleware
   typescript// middleware.ts
   export async function middleware(req: NextRequest) {
   const pathname = req.nextUrl.pathname;

// 1. Перевірка чи шлях публічний (не потребує автентифікації)
if (publicRoutes.includes(pathname) || publicPrefixes.some(prefix => pathname.startsWith(prefix))) {
return NextResponse.next();
}

// 2. Отримання токена з cookies (серверна перевірка)
const accessToken = req.cookies.get('accessToken')?.value;

if (!accessToken) {
// 3. Перенаправлення на сторінку входу, якщо токен відсутній
if (pathname.startsWith('/api/')) {
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

    const url = new URL('/login', req.url);
    url.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(url);

}

// 4. Перевірка валідності токена через JWT Service
try {
const jwtService = new JwtService();
const payload = await jwtService.verifyAccessToken(accessToken);

    if (!payload || !payload.userId) {
      // Токен невалідний - перенаправлення на логін
      throw new Error('Invalid token');
    }

    // 5. Додавання інформації про користувача до запиту
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);

    // 6. Продовження обробки запиту
    return NextResponse.next({
      request: { headers: requestHeaders },
    });

} catch (error) {
// 7. Обробка помилок автентифікації
if (pathname.startsWith('/api/')) {
return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}
const url = new URL('/login', req.url);
url.searchParams.set('returnUrl', pathname);
return NextResponse.redirect(url);
}
}
Клієнтський захист через HOC
typescript// HOC для захисту клієнтських маршрутів
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
return function AuthenticatedComponent(props: P) {
const { user, loading } = useAuth();
const router = useRouter();

    // 1. Перевірка автентифікації при рендерингу компонента
    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    // 2. Показ індикатора завантаження
    if (loading) {
      return <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-8 w-8"></div>
      </div>;
    }

    // 3. Якщо користувач не автентифікований - не рендеримо компонент
    if (!user) {
      return null;
    }

    // 4. Якщо користувач автентифікований - рендеримо компонент з пропсами
    return <Component {...props} />;

};
}

// Використання:
function ProfilePage() { /_ ... _/ }
export default withAuth(ProfilePage); 3. Автоматичне оновлення токену (Token Refresh)
Система включає автоматичне оновлення токенів, щоб користувач залишався автентифікованим без необхідності ручного повторного входу:
typescript// Функція для перевірки та оновлення токена
const refreshTokenIfNeeded = async () => {
try {
const accessToken = localStorage.getItem('accessToken');
if (!accessToken) return;

    // 1. Розбір JWT без бібліотеки для отримання терміну дії
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const expiresAt = payload.exp * 1000; // перетворюємо у мілісекунди

    // 2. Якщо до закінчення терміну менше 5 хвилин, оновлюємо токен
    if (expiresAt - Date.now() < 5 * 60 * 1000) {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        credentials: 'include', // Важливо для надсилання cookies
      });

      if (response.ok) {
        const data = await response.json();

        // 3. Оновлюємо токени в localStorage і cookies
        localStorage.setItem('accessToken', data.accessToken);
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; samesite=strict`;

        // 4. Якщо сторінка відкривається в новій вкладці - оновлюємо стан користувача
        if (!user) {
          const userResponse = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${data.accessToken}` },
          });

          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData.user);
          }
        }
      }
    }

} catch (error) {
console.error('Помилка при оновленні токена:', error);
}
};

// Запуск оновлення за розкладом
useEffect(() => {
const interval = setInterval(refreshTokenIfNeeded, 60 \* 1000); // Перевіряємо щохвилини

// Додаємо обробник зберігання для синхронізації між вкладками
const handleStorageChange = (e: StorageEvent) => {
if (e.key === 'accessToken' && !e.newValue && user) {
// Вихід з системи в іншій вкладці
clearAuthData();
router.push('/login');
} else if (e.key === 'accessToken' && e.newValue && !user) {
// Вхід в іншій вкладці
refreshTokenIfNeeded();
}
};

window.addEventListener('storage', handleStorageChange);

return () => {
clearInterval(interval);
window.removeEventListener('storage', handleStorageChange);
};
}, [user, router]); 4. Захист від CSRF атак
Cross-Site Request Forgery (CSRF) - це тип атаки, коли зловмисний сайт змушує браузер користувача виконувати небажані дії на сайті, де користувач автентифікований. Наша система має захист від цього:
typescript// Генерація CSRF-токена
const generateCsrfToken = () => {
const token = Math.random().toString(36).substring(2);
localStorage.setItem('csrfToken', token);
return token;
};

// Захищений запит з CSRF захистом
const sensitiveRequest = async (url: string, data: any): Promise<Response | null> => {
const csrfToken = localStorage.getItem('csrfToken') || generateCsrfToken();
const accessToken = localStorage.getItem('accessToken');

try {
// 1. Додаємо CSRF токен до заголовків запиту
const response = await fetch(url, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
'X-CSRF-Token': csrfToken, // Важливо: серверний API повинен перевіряти цей токен
'Authorization': accessToken ? `Bearer ${accessToken}` : '',
},
credentials: 'include',
body: JSON.stringify(data),
});

    // 2. Обробка помилок автентифікації (401)
    if (response.status === 401) {
      const refreshSuccessful = await refreshToken();

      if (refreshSuccessful) {
        // 3. Повторюємо запит з новим токеном, якщо оновлення вдалося
        const newAccessToken = localStorage.getItem('accessToken');
        return fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
            'Authorization': `Bearer ${newAccessToken}`,
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      } else {
        // 4. Перенаправляємо на логін, якщо оновлення не вдалося
        handleAuthError();
        return null;
      }
    }

    return response;

} catch (error) {
console.error('Помилка при виконанні захищеного запиту:', error);
return null;
}
};

// Використання:
const handleSubmit = async (formData) => {
const response = await sensitiveRequest('/api/user/update-password', formData);
if (response && response.ok) {
// Обробка успішної відповіді
}
}; 5. Синхронізація стану між вкладками
Важливий аспект зручності користування - синхронізація стану автентифікації між різними вкладками:
typescript// Обробник події localStorage для синхронізації між вкладками
const handleStorageChange = (e: StorageEvent) => {
if (e.key === 'accessToken' && !e.newValue && user) {
// Вихід з системи в іншій вкладці - виходимо і тут
clearAuthData();
router.push('/login');
} else if (e.key === 'accessToken' && e.newValue && !user) {
// Вхід в систему в іншій вкладці - входимо і тут
refreshTokenIfNeeded();
}
};

// Додавання обробника подій
useEffect(() => {
window.addEventListener('storage', handleStorageChange);
return () => window.removeEventListener('storage', handleStorageChange);
}, [user, router]); 6. Захищені запити з автентифікацією
Для зручності виконання запитів, які потребують автентифікації, реалізовано спеціальну обгортку:
typescript// Обгортка для fetch з автентифікацією та обробкою помилок
const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response | null> => {
const accessToken = localStorage.getItem('accessToken');

try {
// 1. Додаємо токен до заголовків запиту
const response = await fetch(url, {
...options,
headers: {
...options.headers,
Authorization: accessToken ? `Bearer ${accessToken}` : '',
},
credentials: 'include', // Включаємо cookies
});

    // 2. Якщо отримуємо 401, спробуємо оновити токен
    if (response.status === 401) {
      const refreshSuccessful = await refreshToken();

      if (refreshSuccessful) {
        // 3. Повторюємо запит з новим токеном
        const newAccessToken = localStorage.getItem('accessToken');
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newAccessToken}`,
          },
          credentials: 'include',
        });
      } else {
        // 4. Перенаправляємо на логін, якщо оновлення не вдалося
        handleAuthError();
        return null;
      }
    }

    return response;

} catch (error) {
console.error('Помилка при виконанні автентифікованого запиту:', error);
return null;
}
};

// Використання:
const fetchUserData = async () => {
const response = await authenticatedFetch('/api/user/profile');
if (response && response.ok) {
const userData = await response.json();
// Обробка даних
}
}; 7. Вихід з системи (Logout)
Процес виходу з системи:
typescriptconst logout = async (): Promise<void> => {
try {
const accessToken = localStorage.getItem('accessToken');

    // 1. Викликаємо API для логауту (блокування токена на сервері)
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

} catch (error) {
console.error('Помилка при виході:', error);
} finally {
// 2. Очищаємо токени та cookies навіть при помилці
clearAuthData();

    // 3. Перенаправляємо на сторінку входу
    router.push('/login');

}
};

// Допоміжна функція для очищення даних автентифікації
const clearAuthData = () => {
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
localStorage.removeItem('csrfToken');
document.cookie = 'accessToken=; path=/; max-age=0; samesite=strict';
setUser(null);
}; 8. Безпека токенів на сервері
На серверній частині використовується чорний список (blacklist) для відкликаних токенів:
typescript// api/auth/logout/route.ts
export async function POST(req: NextRequest) {
try {
// Отримання токена авторизації
const authHeader = req.headers.get('authorization');
const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Отримання refresh токена з кукі
    const refreshToken = req.cookies.get('refresh-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Верифікуємо access токен
    const jwtService = new JwtService();
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload || !payload.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Виходимо з системи, передаючи також access токен для чорного списку
    await authService.logout(payload.userId, refreshToken, token);

    // Очищаємо кукі
    const response = NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
    response.cookies.delete('refresh-token');

    return response;

} catch (error) {
console.error('Logout error:', error);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
}

// Перевірка чорного списку у middleware
const isBlacklisted = await redisClient.isBlacklisted(token);
if (isBlacklisted) {
return { isAuthorized: false, error: 'Token revoked', statusCode: 401 };
}
Практичні сценарії використання

1. Захист компонентів сторінок
   tsx// src/app/(main)/profile/page.tsx
   'use client';

import { withAuth } from '@/domains/auth/presentation/providers/AuthProvider';
import { ProfileForm } from '@/domains/user/presentation/components/ProfileForm';

function ProfilePage() {
return (
<div className="container">
<h1>Профіль користувача</h1>
<ProfileForm />
</div>
);
}

// Захист сторінки від неавторизованого доступу
export default withAuth(ProfilePage); 2. Виконання захищених запитів з оновленням токенів
tsx// src/domains/user/presentation/components/ProfileForm.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export function ProfileForm() {
const [formData, setFormData] = useState({ name: '', email: '' });
const { sensitiveRequest } = useAuth();

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();

    // Використання захищеного запиту з CSRF захистом і автоматичним оновленням токена
    const response = await sensitiveRequest('/api/user/update-profile', formData);

    if (response && response.ok) {
      // Успішне оновлення профілю
    }

};

return (
<form onSubmit={handleSubmit}>
{/_ форма редагування профілю _/}
</form>
);
} 3. Отримання даних користувача з автентифікацією
tsx// src/domains/user/presentation/hooks/useUser.ts
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/domains/auth/presentation/providers/AuthProvider';

export function useUser() {
const [profile, setProfile] = useState(null);
const [loading, setLoading] = useState(true);
const { user, authenticatedFetch } = useAuth();

useEffect(() => {
const fetchProfile = async () => {
if (!user) {
setLoading(false);
return;
}

      // Використання автентифікованого запиту з автоматичним оновленням токена
      const response = await authenticatedFetch('/api/user/profile');

      if (response && response.ok) {
        const data = await response.json();
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();

}, [user, authenticatedFetch]);

return { profile, loading };
} 4. Обробка вразливих операцій на сервері з CSRF захистом
typescript// src/app/api/user/update-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenAndCheckBlacklist } from '@/lib/auth-helpers';

export async function POST(req: NextRequest) {
try {
// 1. Перевірка автентифікації
const authResult = await verifyTokenAndCheckBlacklist(req);
if (!authResult.isAuthorized) {
return NextResponse.json({ error: authResult.error }, { status: authResult.statusCode });
}

    // 2. Перевірка CSRF токена
    const csrfToken = req.headers.get('x-csrf-token');
    if (!csrfToken) {
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }

    // 3. Валідація даних запиту
    const data = await req.json();
    // ... логіка валідації ...

    // 4. Оновлення пароля
    const userService = ServiceFactory.createUserService();
    const result = await userService.updatePassword(authResult.userId, data.currentPassword, data.newPassword);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });

} catch (error) {
console.error('Error updating password:', error);
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
}
Розширені можливості системи

1.  Підтримка соціальних мереж
    Система може бути розширена для підтримки входу через соціальні мережі (Google, Facebook, тощо):
    typescript// Додавання методу для автентифікації через соціальні мережі
    const loginWithSocialProvider = async (provider: 'google' | 'facebook') => {
    try {
    // Перенаправлення на ендпоінт соціальної автентифікації
    window.location.href = `/api/auth/${provider}`;
    return { success: true };
    } catch (error) {
    console.error(`Помилка входу через ${provider}:`, error);
    return {
    success: false,
    error: `Сталася помилка під час входу через ${provider}`,
    };
    }
    };
2.  Багаторівнева автентифікація (MFA)
    Підтримка багаторівневої автентифікації (2FA/MFA):
    typescript// Розширення функції login для підтримки MFA
    const login = async (email: string, password: string) => {
    try {
    const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    });

        const data = await response.json();

        if (!response.ok) {
          return { success: false, error: data.error };
        }

        // Перевірка необхідності другого фактора автентифікації
        if (data.requiresMfa) {
          return {
            success: true,
            requiresMfa: true,
            mfaToken: data.mfaToken // Тимчасовий токен для MFA процесу
          };
        }

        // Стандартний процес входу, якщо MFA не потрібна
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        // ... інші операції ...

        return { success: true };

    } catch (error) {
    console.error('Помилка при вході:', error);
    return { success: false, error: 'Сталася помилка під час входу в систему' };
    }
    };

// Функція для завершення MFA процесу
const completeMfa = async (mfaToken: string, code: string) => {
try {
const response = await fetch('/api/auth/verify-mfa', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ mfaToken, code }),
});

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    // Завершення процесу входу після успішної MFA
    localStorage.setItem('accessToken', data.tokens.accessToken);
    localStorage.setItem('refreshToken', data.tokens.refreshToken);
    document.cookie = `accessToken=${data.tokens.accessToken}; path=/; max-age=86400; samesite=strict`;
    setUser(data.user);

    return { success: true };

} catch (error) {
console.error('Помилка при перевірці MFA:', error);
return { success: false, error: 'Сталася помилка під час перевірки коду' };
}
};
Висновок
Система автентифікації Next.js DDD Chat забезпечує комплексний захист та зручність використання за допомогою:

JWT токенів для безпечної автентифікації та авторизації
Подвійного зберігання токенів (localStorage і cookies) для підтримки клієнтської та серверної автентифікації
Захисту від CSRF атак через спеціальні токени та заголовки
Автоматичного оновлення токенів для безперервної роботи користувача
Синхронізації стану між вкладками для зручного користувацького досвіду
Захищених HTTP запитів з автоматичною обробкою помилок автентифікації
HOC компонентів для захисту маршрутів на клієнтській стороні
Middleware для захисту API ендпоінтів на серверній стороні

Ця архітектура надає гнучку, безпечну та масштабовану основу для авторизації в додатку, яка дотримується принципів Domain-Driven Design і забезпечує оптимальний баланс між безпекою та зручністю використання.
