// src/domains/user/presentation/controllers/userController.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ServiceFactory } from '@/shared/infrastructure/DependencyInjection';

/**
 * Контролер для роботи з користувачами
 */
export class UserController {
  /**
   * Отримати профіль користувача
   */
  static async getProfile(req: NextRequest) {
    try {
      // Перевірка аутентифікації
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Отримання профілю з сервісу
      const userService = ServiceFactory.createUserService();
      const profile = await userService.getUserProfile(session.user.id);

      if (!profile) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  /**
   * Оновити профіль користувача
   */
  static async updateProfile(req: NextRequest) {
    try {
      // Перевірка аутентифікації
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Отримання даних з запиту
      const data = await req.json();
      const { name, bio } = data;

      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      }

      // Оновлення профілю
      const userService = ServiceFactory.createUserService();
      const updatedProfile = await userService.updateUserProfile(session.user.id, name, bio);

      if (!updatedProfile) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 400 });
      }

      return NextResponse.json(updatedProfile);
    } catch (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  /**
   * Оновити аватар користувача
   */
  static async updateAvatar(req: NextRequest) {
    try {
      // Перевірка аутентифікації
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Отримання URL аватара з запиту
      const data = await req.json();
      const { imageUrl } = data;

      if (!imageUrl) {
        return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
      }

      // Оновлення аватара
      const userService = ServiceFactory.createUserService();
      const updatedProfile = await userService.updateUserAvatar(session.user.id, imageUrl);

      if (!updatedProfile) {
        return NextResponse.json({ error: 'Failed to update avatar' }, { status: 400 });
      }

      return NextResponse.json(updatedProfile);
    } catch (error) {
      console.error('Error updating user avatar:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }

  /**
   * Пошук користувачів за ім'ям
   */
  static async searchUsers(req: NextRequest) {
    try {
      // Перевірка аутентифікації
      const session = await getServerSession(authOptions);

      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Отримання параметрів запиту
      const url = new URL(req.url);
      const query = url.searchParams.get('query') || '';
      const limit = parseInt(url.searchParams.get('limit') || '10');

      if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      // Пошук користувачів
      const userService = ServiceFactory.createUserService();
      const users = await userService.searchUsers(query, limit);

      return NextResponse.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
}
