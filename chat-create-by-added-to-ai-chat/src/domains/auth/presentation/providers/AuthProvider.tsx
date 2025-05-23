// src/domains/auth/presentation/providers/AuthProvider.tsx
'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import TokenManager from '@/shared/utils/tokenManager';

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
  refreshTokenIfNeeded: (force?: boolean) => Promise<boolean>; // Додана нова функція
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
  const [tokenRefreshInProgress, setTokenRefreshInProgress] = useState(false);

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
  // Функція для перевірки та оновлення токена
  const refreshTokenIfNeeded = useCallback(
    async (force = false): Promise<boolean> => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken || !refreshToken) {
          console.log('No tokens found, skipping refresh');
          return false;
        }

        // Перевіряємо, чи токен скоро закінчиться або оновлення примусове
        if (force || TokenManager.isTokenExpiringSoon(accessToken)) {
          console.log('Token is about to expire or force refresh requested, refreshing...');

          // Запобігаємо паралельним оновленням
          if (tokenRefreshInProgress) {
            console.log('Token refresh already in progress, skipping');
            return false;
          }

          setTokenRefreshInProgress(true);

          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error('Failed to refresh token');
          }

          const data = await response.json();

          if (data.accessToken && data.refreshToken) {
            TokenManager.saveTokens(data.accessToken, data.refreshToken);
            console.log('Tokens refreshed successfully');
            return true;
          } else {
            throw new Error('Invalid token response format');
          }
        }

        return false;
      } catch (error) {
        console.error('Error refreshing token:', error);
        // При помилці оновлення, виходимо з системи
        handleAuthError();
        return false;
      } finally {
        setTokenRefreshInProgress(false);
      }
    },
    [tokenRefreshInProgress]
  );

  // Автоматичне оновлення токену з інтервалом
  useEffect(() => {
    if (!user) return;

    // Перевіряємо термін дії токену кожні 30 секунд
    const interval = setInterval(refreshTokenIfNeeded, 30000);

    // Також спробуємо оновити токен при завантаженні компонента
    refreshTokenIfNeeded();

    return () => clearInterval(interval);
  }, [user, refreshTokenIfNeeded]);

  // Перевірка та оновлення токену при необхідності
  const refreshTokenIfNeededOriginal = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.log('No access token found, skipping refresh');
        return;
      }

      // Розбір JWT без бібліотеки (спрощено)
      const parts = accessToken.split('.');
      if (parts.length !== 3) {
        console.error('Invalid access token format');
        return;
      }

      try {
        const payload = JSON.parse(atob(parts[1]));
        const expiresAt = payload.exp * 1000; // перетворюємо у мілісекунди
        const timeToExpire = expiresAt - Date.now();

        console.log(`Access token expires in: ${Math.floor(timeToExpire / 1000)} seconds`);

        // Якщо до закінчення терміну менше 5 хвилин, оновлюємо токен
        if (timeToExpire < 5 * 60 * 1000) {
          console.log('Token is about to expire, attempting refresh...');

          // Отримуємо refresh token з localStorage
          const refreshToken = localStorage.getItem('refreshToken');

          if (!refreshToken) {
            console.error('No refresh token available in localStorage');
            return;
          }

          console.log('Sending refresh token request with token from localStorage');

          const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
            credentials: 'include', // Важливо для отримання cookies
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Token refreshed successfully, received new tokens:', {
              accessToken: data.accessToken ? 'present' : 'missing',
              refreshToken: data.refreshToken ? 'present' : 'missing',
            });

            if (data.accessToken) {
              localStorage.setItem('accessToken', data.accessToken);

              // Перевіримо refresh token в відповіді
              if (data.refreshToken) {
                localStorage.setItem('refreshToken', data.refreshToken);
                console.log('New refresh token saved to localStorage');
              } else {
                console.warn(
                  'No refresh token in response data - check your server implementation'
                );
              }

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
            } else {
              console.error('No access token in refresh response');
            }
          } else {
            console.error('Failed to refresh token:', await response.text());
          }
        }
      } catch (error) {
        console.error('Error parsing token payload:', error);
      }
    } catch (error) {
      console.error('Помилка при оновленні токена:', error);
    }
  }, [user]);

  // Автоматичне оновлення токену з інтервалом
  useEffect(() => {
    // Перевіряємо термін дії токену кожну хвилину
    const interval = setInterval(() => {
      refreshTokenIfNeeded().catch(err => {
        console.error('Error in token refresh interval:', err);
      });
    }, 60 * 1000);

    // Запускаємо перевірку при завантаженні компонента
    refreshTokenIfNeeded().catch(err => {
      console.error('Error in initial token refresh:', err);
    });

    return () => clearInterval(interval);
  }, [refreshTokenIfNeeded]);

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
  // Оновлюємо authenticatedFetch для автоматичного оновлення токена
  const authenticatedFetch = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response | null> => {
    try {
      let accessToken = localStorage.getItem('accessToken');

      // Якщо токен відсутній або закінчується, спробуємо оновити
      if (!accessToken || TokenManager.isTokenExpiringSoon(accessToken)) {
        const refreshed = await refreshTokenIfNeeded(true);
        if (refreshed) {
          accessToken = localStorage.getItem('accessToken');
        }
      }

      // Якщо токен все ще відсутній, повертаємо помилку
      if (!accessToken) {
        handleAuthError();
        return null;
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${accessToken}`,
        },
        credentials: 'include',
      });

      // Якщо отримуємо 401, спробуємо оновити токен і повторити запит
      if (response.status === 401) {
        const refreshed = await refreshTokenIfNeeded(true);

        if (refreshed) {
          // Отримуємо оновлений токен
          accessToken = localStorage.getItem('accessToken');

          // Повторюємо запит з новим токеном
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${accessToken}`,
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
      console.error('Error in authenticatedFetch:', error);
      return null;
    }
  };

  // Додаємо слухачів подій для синхронізації між вкладками
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken') {
        if (!e.newValue && user) {
          // Токен видалено в іншій вкладці
          clearAuthData();
          router.push('/login');
        } else if (e.newValue && !user) {
          // Токен з'явився в іншій вкладці
          refreshTokenIfNeeded();
        }
      }
    };

    // Слухаємо події localStorage для синхронізації між вкладками
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, router, refreshTokenIfNeeded]);

  // Обробка помилок автентифікації
  const handleAuthError = () => {
    // Очищаємо дані автентифікації
    clearAuthData();

    // Перенаправляємо на сторінку логіну
    router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('Починаємо процес входу для:', email);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include', // Важливо для отримання cookies
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Невдалий вхід:', data.error);
        return {
          success: false,
          error: data.error || 'Помилка входу в систему',
        };
      }

      console.log('Автентифікація успішна, обробка токенів');
      console.log('Дані відповіді:', {
        hasUser: !!data.user,
        hasTokens: !!data.tokens,
        accessToken: data.tokens?.accessToken ? 'present' : 'missing',
        refreshToken: data.tokens?.refreshToken ? 'present' : 'missing',
      });

      // Переконуємось, що токени існують перед збереженням
      if (data.tokens && data.tokens.accessToken) {
        // Безпечне збереження токенів у localStorage
        try {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          console.log('Access token збережено:', data.tokens.accessToken.substring(0, 10) + '...');

          if (data.tokens.refreshToken) {
            localStorage.setItem('refreshToken', data.tokens.refreshToken);
            console.log(
              'Refresh token збережено:',
              data.tokens.refreshToken.substring(0, 10) + '...'
            );
          } else {
            console.warn('RefreshToken відсутній у відповіді API');
            // Спроба отримати з cookie - хоча HttpOnly cookie не буде доступний для JavaScript
            const cookies = document.cookie
              .split(';')
              .map(cookie => cookie.trim())
              .reduce(
                (acc, current) => {
                  const [name, value] = current.split('=');
                  acc[name] = value;
                  return acc;
                },
                {} as Record<string, string>
              );

            console.log('Cookies доступні в браузері:', cookies);
          }
        } catch (storageError) {
          console.error('Помилка при збереженні токенів у localStorage:', storageError);
        }

        // Генеруємо CSRF токен при логіні, якщо потрібно
        generateCsrfToken();

        // Тестова перевірка збережених токенів через 1 секунду
        setTimeout(() => {
          try {
            const savedAccessToken = localStorage.getItem('accessToken');
            const savedRefreshToken = localStorage.getItem('refreshToken');
            console.log('Перевірка збережених токенів:', {
              hasAccessToken: !!savedAccessToken,
              accessTokenLength: savedAccessToken?.length,
              hasRefreshToken: !!savedRefreshToken,
              refreshTokenLength: savedRefreshToken?.length,
            });
          } catch (e) {
            console.error('Помилка при перевірці токенів:', e);
          }
        }, 1000);

        // Встановлюємо користувача в стан
        setUser(data.user);

        console.log('Процес входу завершено успішно');
        return { success: true };
      } else {
        console.error('Отримано відповідь без валідних токенів:', data);
        return {
          success: false,
          error: 'Отримано невалідні дані автентифікації',
        };
      }
    } catch (error) {
      console.error('Помилка при вході:', error);
      return {
        success: false,
        error: 'Сталася помилка під час входу в систему',
      };
    }
  };

  // Безпечна робота з localStorage
  const safeLocalStorage = {
    get: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.error(`Error getting ${key} from localStorage:`, e);
        return null;
      }
    },
    set: (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (e) {
        console.error(`Error setting ${key} in localStorage:`, e);
        return false;
      }
    },
    remove: (key: string): boolean => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error(`Error removing ${key} from localStorage:`, e);
        return false;
      }
    },
  };

  // Потім використовуйте safeLocalStorage замість прямих викликів localStorage

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

  // Додаємо функцію refreshTokenIfNeeded до контексту аутентифікації
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
        refreshTokenIfNeeded,
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
