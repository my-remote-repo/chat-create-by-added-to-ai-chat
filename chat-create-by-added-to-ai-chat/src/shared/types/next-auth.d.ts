import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Розширення інтерфейсу Session для додавання id користувача
   */
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
  }
}

declare module "next-auth/jwt" {
  /**
   * Розширення інтерфейсу JWT для додавання id користувача
   */
  interface JWT {
    id?: string;
  }
}