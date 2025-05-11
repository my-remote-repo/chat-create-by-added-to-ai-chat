// src/shared/utils/tokenManager.ts

// Буфер часу (5 хвилин) до закінчення токену, коли ми вважаємо, що його треба оновити
const JWT_EXPIRY_BUFFER_MS = 5 * 60 * 1000;

class TokenManager {
  // Перевіряє, чи токен потребує оновлення (залишилось менше 5 хвилин)
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = this.getTokenPayload(token);
      if (!payload || !payload.exp) return true;

      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      return Date.now() > expiresAt - JWT_EXPIRY_BUFFER_MS;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true; // На всякий випадок оновлюємо при помилці
    }
  }

  // Отримує payload з JWT токену
  static getTokenPayload(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Error decoding token payload:', error);
      return null;
    }
  }

  // Отримує час життя токену у мілісекундах
  static getTokenRemainingTime(token: string): number {
    try {
      const payload = this.getTokenPayload(token);
      if (!payload || !payload.exp) return 0;
      return Math.max(0, payload.exp * 1000 - Date.now());
    } catch (error) {
      console.error('Error getting token remaining time:', error);
      return 0;
    }
  }

  // Зберігає токени у localStorage
  static saveTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Диспатчимо кастомну подію для сповіщення інших компонентів про оновлення токенів
      window.dispatchEvent(
        new CustomEvent('tokensUpdated', {
          detail: { accessToken, refreshToken },
        })
      );
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  // Видаляє токени з localStorage
  static clearTokens(): void {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      // Диспатчимо кастомну подію для сповіщення інших компонентів про видалення токенів
      window.dispatchEvent(new CustomEvent('tokensCleared'));
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }
}

export default TokenManager;
