import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Об'єднує класи Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Форматує дату в читабельний формат (напр. "10 квітня 2023, 14:30")
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('uk-UA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Форматує відносну дату (напр. "5 хвилин тому", "Вчора", тощо)
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Щойно';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${pluralize(diffInMinutes, 'хвилина', 'хвилини', 'хвилин')} тому`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${pluralize(diffInHours, 'година', 'години', 'годин')} тому`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Вчора';
  }

  if (diffInDays < 7) {
    return `${diffInDays} ${pluralize(diffInDays, 'день', 'дні', 'днів')} тому`;
  }

  return formatDate(date);
}

/**
 * Правильне відмінювання слів в залежності від числа
 * Наприклад: 1 повідомлення, 2 повідомлення, 5 повідомлень
 */
export function pluralize(count: number, one: string, few: string, many: string): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return one;
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return few;
  }

  return many;
}

/**
 * Обрізає текст до певної довжини і додає "..." якщо потрібно
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Генерує рандомний колір на основі рядка (e.g., імені користувача)
 * Корисно для створення аватарів з ініціалами
 */
export function stringToColor(str?: string | null): string {
  if (!str) return '#888888'; // Повертає нейтральний сірий колір для відсутніх імен

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }

  return color;
}

/**
 * Отримує ініціали з імені
 */
export function getInitials(name?: string | null): string {
  if (!name) return 'U'; // Повертає 'U' якщо ім'я не визначено (як "User")

  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Затримка виконання асинхронної функції
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Перевіряє, чи є URL зображенням
 */
export function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  return imageExtensions.some(ext => url.toLowerCase().endsWith(ext));
}
