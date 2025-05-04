'use client';

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
          // Якщо помилка - видаляємо токен
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Помилка автентифікації');
      }

      const data = await response.json();

      // Зберігаємо токени
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);

      // Встановлюємо користувача
      setUser(data.user);

      return true;
    } catch (error) {
      console.error('Помилка при вході:', error);
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password, confirmPassword: password }),
      });

      if (!response.ok) {
        throw new Error('Помилка реєстрації');
      }

      // Успішно зареєстровано
      return true;
    } catch (error) {
      console.error('Помилка при реєстрації:', error);
      return false;
    }
  };

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
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
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
