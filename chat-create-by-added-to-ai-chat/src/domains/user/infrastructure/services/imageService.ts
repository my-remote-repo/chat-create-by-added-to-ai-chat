import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { S3FileUploadService } from '@/domains/message/infrastructure/services/fileUploadService';

export class ImageService {
  private readonly fileUploadService: S3FileUploadService;
  private readonly localStoragePath: string;
  private readonly avatarSizes = [32, 64, 128, 256];

  constructor() {
    this.fileUploadService = new S3FileUploadService();
    this.localStoragePath =
      process.env.LOCAL_STORAGE_PATH || path.join(process.cwd(), 'public/uploads');
  }

  /**
   * Обробляє та зберігає аватар користувача
   */
  async processAndSaveAvatar(
    userId: string,
    imageBuffer: Buffer,
    mimeType: string
  ): Promise<string> {
    try {
      // Перевіряємо, чи тип файлу підтримується
      if (!this.isSupportedImageType(mimeType)) {
        throw new Error('Unsupported image type. Please use JPEG, PNG, or WebP');
      }

      // Створюємо унікальний ідентифікатор для файлу
      const fileId = uuidv4();
      const storageMethod = process.env.STORAGE_METHOD || 'local';

      // Оптимізуємо оригінальне зображення (зберігаємо пропорції, максимальна сторона 1024px)
      const optimizedBuffer = await sharp(imageBuffer)
        .resize({
          width: 1024,
          height: 1024,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      // Створюємо та зберігаємо різні розміри аватара
      const avatarVersions: { [key: string]: string } = {};

      if (storageMethod === 's3') {
        // Зберігаємо оригінал
        const originalResult = await this.fileUploadService.uploadFile(
          {
            name: `${fileId}.webp`,
            buffer: optimizedBuffer,
            size: optimizedBuffer.length,
            type: 'image/webp',
          },
          `avatars/${userId}`
        );

        if (!originalResult.success || !originalResult.url) {
          throw new Error('Failed to upload original avatar');
        }

        avatarVersions.original = originalResult.url;

        // Створюємо і зберігаємо різні розміри
        for (const size of this.avatarSizes) {
          const resizedBuffer = await sharp(imageBuffer)
            .resize(size, size, {
              fit: 'cover',
              position: 'center',
            })
            .webp({ quality: 80 })
            .toBuffer();

          const sizeResult = await this.fileUploadService.uploadFile(
            {
              name: `${fileId}_${size}.webp`,
              buffer: resizedBuffer,
              size: resizedBuffer.length,
              type: 'image/webp',
            },
            `avatars/${userId}`
          );

          if (sizeResult.success && sizeResult.url) {
            avatarVersions[`${size}`] = sizeResult.url;
          }
        }
      } else {
        // Локальне зберігання
        const userDir = path.join(this.localStoragePath, 'avatars', userId);

        // Створюємо директорію, якщо її не існує
        await fs.mkdir(userDir, { recursive: true });

        // Зберігаємо оригінал
        const originalPath = path.join(userDir, `${fileId}.webp`);
        await fs.writeFile(originalPath, optimizedBuffer);

        avatarVersions.original = `/uploads/avatars/${userId}/${fileId}.webp`;

        // Створюємо і зберігаємо різні розміри
        for (const size of this.avatarSizes) {
          const resizedBuffer = await sharp(imageBuffer)
            .resize(size, size, {
              fit: 'cover',
              position: 'center',
            })
            .webp({ quality: 80 })
            .toBuffer();

          const sizePath = path.join(userDir, `${fileId}_${size}.webp`);
          await fs.writeFile(sizePath, resizedBuffer);

          avatarVersions[`${size}`] = `/uploads/avatars/${userId}/${fileId}_${size}.webp`;
        }
      }

      // Зберігаємо всі URL у форматі JSON
      return JSON.stringify(avatarVersions);
    } catch (error) {
      console.error('Avatar processing error:', error);
      throw new Error('Failed to process avatar');
    }
  }

  /**
   * Перевіряє, чи тип файлу підтримується
   */
  private isSupportedImageType(mimeType: string): boolean {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    return supportedTypes.includes(mimeType);
  }
}
