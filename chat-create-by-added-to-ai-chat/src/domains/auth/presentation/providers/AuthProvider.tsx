// src/domains/auth/presentation/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPasswordConfirm: (
    token: string,
    password: string,
    confirmPassword: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  isAuthenticated: boolean;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Перевіряємо, чи є токен у localStorage
    const accessToken = localStorage.getItem('accessToken');

    if (accessToken) {
      // Спробуємо отримати дані користувача
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Помилка авторизації');
        })
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          // Якщо помилка - видаляємо токен і пробуємо оновити через refresh token
          refreshToken().catch(() => {
            // Якщо не вдалося оновити, видаляємо все
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          });
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const refreshToken = async (): Promise<boolean> => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) throw new Error('Не вдалося оновити токен');

      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);

      // Отримуємо дані користувача з оновленим токеном
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
        },
      });

      if (!userResponse.ok) throw new Error('Не вдалося отримати дані користувача');

      const userData = await userResponse.json();
      setUser(userData.user);

      return true;
    } catch (error) {
      console.error('Помилка оновлення токена:', error);
      return false;
    }
  };
  // Додайте цей код після визначення станів
  // useEffect(() => {
  //   console.log('Auth state changed:', {
  //     user,
  //     isAuthenticated: !!user,
  //     loading,
  //   });
  // }, [user, loading]);
  // В AuthProvider.tsx у функції login
  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Помилка входу в систему',
        };
      }

      // Зберігаємо токени в localStorage (для клієнтських запитів)
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);

      // Зберігаємо accessToken у cookie для middleware (для серверних запитів)
      document.cookie = `accessToken=${data.tokens.accessToken}; path=/; max-age=86400; samesite=strict`;

      // Встановлюємо користувача в стан
      setUser(data.user);

      return { success: true };
    } catch (error) {
      console.error('Помилка при вході:', error);
      return {
        success: false,
        error: 'Сталася помилка під час входу в систему',
      };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword: string
  ) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || (data.details ? data.details[0]?.message : 'Помилка реєстрації'),
        };
      }

      // Успішно зареєстровано
      return { success: true };
    } catch (error) {
      console.error('Помилка при реєстрації:', error);
      return {
        success: false,
        error: 'Сталася помилка під час реєстрації',
      };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Помилка запиту на скидання пароля',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Помилка при запиті на скидання пароля:', error);
      return {
        success: false,
        error: 'Сталася помилка під час запиту на скидання пароля',
      };
    }
  };

  const resetPasswordConfirm = async (token: string, password: string, confirmPassword: string) => {
    try {
      const response = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Помилка скидання пароля',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Помилка при скиданні пароля:', error);
      return {
        success: false,
        error: 'Сталася помилка під час скидання пароля',
      };
    }
  };

  // В AuthProvider.tsx, у функції logout
  const logout = async (): Promise<void> => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      // Викликаємо API для логауту
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch (error) {
      console.error('Помилка при виході:', error);
    } finally {
      // Видаляємо токени навіть при помилці
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Видаляємо cookie
      document.cookie = 'accessToken=; path=/; max-age=0; samesite=strict';

      setUser(null);
      // Перенаправлення на сторінку входу
      router.push('/login');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        resetPassword,
        resetPasswordConfirm,
        isAuthenticated: !!user,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth має використовуватись в AuthProvider');
  }
  return context;
}
