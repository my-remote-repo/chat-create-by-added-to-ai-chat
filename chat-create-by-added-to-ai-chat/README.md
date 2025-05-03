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
│   └── schema.prisma
├── public/
│   ├── favicon.ico
│   └── images/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (main)/
│   │   │   ├── chat/
│   │   │   │   ├── [chatId]/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   ├── chat/
│   │   │   │   └── route.ts
│   │   │   ├── message/
│   │   │   │   └── route.ts
│   │   │   ├── upload/
│   │   │   │   └── route.ts
│   │   │   └── webhook/
│   │   │       └── route.ts
│   │   ├── embed/
│   │   │   └── page.tsx
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── domains/
│   │   ├── auth/
│   │   │   ├── application/
│   │   │   │   ├── services/
│   │   │   │   │   └── authService.ts
│   │   │   │   └── useCases/
│   │   │   │       ├── loginUseCase.ts
│   │   │   │       └── registerUseCase.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── authUser.ts
│   │   │   │   └── repositories/
│   │   │   │       └── authRepository.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prismaAuthRepository.ts
│   │   │   │   └── services/
│   │   │   │       └── nextAuthAdapter.ts
│   │   │   └── presentation/
│   │   │       ├── components/
│   │   │       │   ├── LoginForm.tsx
│   │   │       │   └── RegisterForm.tsx
│   │   │       ├── hooks/
│   │   │       │   └── useAuth.ts
│   │   │       └── providers/
│   │   │           └── AuthProvider.tsx
│   │   ├── chat/
│   │   │   ├── application/
│   │   │   │   ├── services/
│   │   │   │   │   └── chatService.ts
│   │   │   │   └── useCases/
│   │   │   │       ├── createChatUseCase.ts
│   │   │   │       └── getChatListUseCase.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── chat.ts
│   │   │   │   │   └── participant.ts
│   │   │   │   └── repositories/
│   │   │   │       └── chatRepository.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prismaChatRepository.ts
│   │   │   │   └── services/
│   │   │   │       └── socketService.ts
│   │   │   └── presentation/
│   │   │       ├── components/
│   │   │       │   ├── ChatList.tsx
│   │   │       │   └── ChatRoom.tsx
│   │   │       ├── hooks/
│   │   │       │   └── useChat.ts
│   │   │       └── providers/
│   │   │           └── ChatProvider.tsx
│   │   ├── message/
│   │   │   ├── application/
│   │   │   │   ├── services/
│   │   │   │   │   └── messageService.ts
│   │   │   │   └── useCases/
│   │   │   │       ├── createMessageUseCase.ts
│   │   │   │       └── getMessageListUseCase.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── file.ts
│   │   │   │   │   └── message.ts
│   │   │   │   └── repositories/
│   │   │   │       └── messageRepository.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prismaMessageRepository.ts
│   │   │   │   └── services/
│   │   │   │       └── fileUploadService.ts
│   │   │   └── presentation/
│   │   │       ├── components/
│   │   │       │   ├── MessageInput.tsx
│   │   │       │   └── MessageList.tsx
│   │   │       ├── hooks/
│   │   │       │   └── useMessages.ts
│   │   │       └── providers/
│   │   │           └── MessageProvider.tsx
│   │   ├── notification/
│   │   │   ├── application/
│   │   │   │   ├── services/
│   │   │   │   │   └── notificationService.ts
│   │   │   │   └── useCases/
│   │   │   │       └── sendNotificationUseCase.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── notification.ts
│   │   │   │   └── repositories/
│   │   │   │       └── notificationRepository.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prismaNotificationRepository.ts
│   │   │   │   └── services/
│   │   │   │       └── webPushService.ts
│   │   │   └── presentation/
│   │   │       ├── components/
│   │   │       │   └── NotificationList.tsx
│   │   │       └── hooks/
│   │   │           └── useNotifications.ts
│   │   ├── user/
│   │   │   ├── application/
│   │   │   │   ├── services/
│   │   │   │   │   └── userService.ts
│   │   │   │   └── useCases/
│   │   │   │       ├── getUserProfileUseCase.ts
│   │   │   │       └── updateUserProfileUseCase.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── user.ts
│   │   │   │   └── repositories/
│   │   │   │       └── userRepository.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── repositories/
│   │   │   │   │   └── prismaUserRepository.ts
│   │   │   │   └── services/
│   │   │   │       └── avatarService.ts
│   │   │   └── presentation/
│   │   │       ├── components/
│   │   │       │   ├── Avatar.tsx
│   │   │       │   └── ProfileForm.tsx
│   │   │       ├── hooks/
│   │   │       │   └── useUser.ts
│   │   │       └── providers/
│   │   │           └── UserProvider.tsx
│   │   └── embed/
│   │       ├── application/
│   │       │   ├── services/
│   │       │   │   └── embedService.ts
│   │       │   └── useCases/
│   │       │       └── generateEmbedCodeUseCase.ts
│   │       ├── domain/
│   │       │   ├── entities/
│   │       │   │   └── embedConfig.ts
│   │       │   └── repositories/
│   │       │       └── embedRepository.ts
│   │       ├── infrastructure/
│   │       │   ├── repositories/
│   │       │   │   └── prismaEmbedRepository.ts
│   │       │   └── services/
│   │       │       └── tokenService.ts
│   │       └── presentation/
│   │           ├── components/
│   │           │   ├── EmbedChat.tsx
│   │           │   └── EmbedGenerator.tsx
│   │           └── hooks/
│   │               └── useEmbed.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   ├── socket.ts
│   │   └── utils.ts
│   └── shared/
│       ├── components/
│       │   ├── ui/
│       │   │   ├── button.tsx
│       │   │   ├── input.tsx
│       │   │   └── ...
│       │   ├── layouts/
│       │   │   ├── MainLayout.tsx
│       │   │   └── AuthLayout.tsx
│       │   └── common/
│       │       ├── Header.tsx
│       │       └── Footer.tsx
│       ├── hooks/
│       │   ├── useLocalStorage.ts
│       │   └── useMediaQuery.ts
│       ├── providers/
│       │   └── ThemeProvider.tsx
│       ├── types/
│       │   ├── next-auth.d.ts
│       │   └── index.ts
│       └── utils/
│           ├── formatDate.ts
│           └── validation.ts
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