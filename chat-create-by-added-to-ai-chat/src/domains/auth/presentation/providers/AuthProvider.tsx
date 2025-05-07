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
  sensitiveRequest: (url: string, data: any) => Promise<Response | null>;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Генерація CSRF-токена
const generateCsrfToken = () => {
  const token = Math.random().toString(36).substring(2);
  localStorage.setItem('csrfToken', token);
  return token;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Перевірка автентифікації при завантаженні
  useEffect(() => {
    const checkAuth = async () => {
      // Перевіряємо, чи є токен у localStorage
      const accessToken = localStorage.getItem('accessToken');

      if (accessToken) {
        try {
          // Отримуємо дані користувача
          const res = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            // Якщо токен недійсний, спробуємо оновити
            const refreshed = await refreshToken();
            if (!refreshed) {
              clearAuthData();
            }
          }
        } catch (error) {
          console.error('Помилка перевірки автентифікації:', error);
          clearAuthData();
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  // Допоміжна функція для очищення даних автентифікації
  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('csrfToken');
    document.cookie = 'accessToken=; path=/; max-age=0; samesite=strict';
    setUser(null);
  };

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

      // Також оновлюємо cookie
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; samesite=strict`;

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

  // Функція для перевірки та оновлення токена
  const refreshTokenIfNeeded = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      // Розбір JWT без бібліотеки (спрощено)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = payload.exp * 1000; // перетворюємо у мілісекунди

      // Якщо до закінчення терміну менше 5 хвилин, оновлюємо токен
      if (expiresAt - Date.now() < 5 * 60 * 1000) {
        const response = await fetch('/api/auth/refresh-token', {
          method: 'POST',
          credentials: 'include', // Важливо для надсилання cookies
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('accessToken', data.accessToken);
          document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; samesite=strict`;

          // Якщо сторінка оновлюється або відкривається нова вкладка,
          // це допоможе зберегти консистентний стан автентифікації
          if (!user) {
            const userResponse = await fetch('/api/auth/me', {
              headers: {
                Authorization: `Bearer ${data.accessToken}`,
              },
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

  // Інтервал для перевірки та оновлення токена
  useEffect(() => {
    const interval = setInterval(refreshTokenIfNeeded, 60 * 1000); // Перевіряємо щохвилини

    // Додаємо обробник зберігання для синхронізації між вкладками
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && !e.newValue && user) {
        // Якщо токен видалено в іншій вкладці, виходимо і тут
        clearAuthData();
        router.push('/login');
      } else if (e.key === 'accessToken' && e.newValue && !user) {
        // Якщо токен з'явився в іншій вкладці, оновлюємо стан і тут
        refreshTokenIfNeeded();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Очищення при розмонтуванні
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, router]);

  // Захищений запит з CSRF захистом
  const sensitiveRequest = async (url: string, data: any): Promise<Response | null> => {
    const csrfToken = localStorage.getItem('csrfToken') || generateCsrfToken();
    const accessToken = localStorage.getItem('accessToken');

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        credentials: 'include', // Включаємо cookies
        body: JSON.stringify(data),
      });

      // Обробка помилок автентифікації
      if (response.status === 401) {
        // Спробуємо оновити токен
        const refreshSuccessful = await refreshToken();

        if (refreshSuccessful) {
          // Повторюємо запит з новим токеном
          const newAccessToken = localStorage.getItem('accessToken');
          return fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
              Authorization: `Bearer ${newAccessToken}`,
            },
            credentials: 'include',
            body: JSON.stringify(data),
          });
        } else {
          // Якщо не вдалося оновити токен, очищаємо дані автентифікації
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

  // Обгортка для fetch з автентифікацією та обробкою помилок
  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response | null> => {
    const accessToken = localStorage.getItem('accessToken');

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: accessToken ? `Bearer ${accessToken}` : '',
        },
        credentials: 'include', // Включаємо cookies
      });

      // Якщо отримуємо 401, спробуємо оновити токен
      if (response.status === 401) {
        const refreshSuccessful = await refreshToken();

        if (refreshSuccessful) {
          // Повторюємо запит з новим токеном
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
          // Якщо не вдалося оновити токен
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

  // Обробка помилок автентифікації
  const handleAuthError = () => {
    // Очищаємо дані автентифікації
    clearAuthData();

    // Перенаправляємо на сторінку логіну
    router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
  };

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

      // Генеруємо CSRF токен при логіні
      generateCsrfToken();

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
      clearAuthData();

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
        sensitiveRequest,
        authenticatedFetch,
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

// HOC для захисту маршрутів
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full border-2 border-current border-t-transparent h-8 w-8"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}
