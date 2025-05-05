import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';

// Типи для завантаження файлів
export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  buffer: Buffer;
}

/**
 * Сервіс для завантаження файлів в S3
 */
export class S3FileUploadService {
  private s3: AWS.S3;
  private bucket: string;

  constructor() {
    // Ініціалізація AWS S3 клієнта
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    this.bucket = process.env.AWS_BUCKET_NAME || '';

    if (!this.bucket) {
      console.error('AWS_BUCKET_NAME is not defined in environment variables');
    }
  }

  /**
   * Завантажити файл в S3
   */
  async uploadFile(file: FileInfo, folder: string = 'uploads'): Promise<UploadResult> {
    if (!this.bucket) {
      return {
        success: false,
        error: 'S3 bucket is not configured',
      };
    }

    try {
      // Створення безпечного імені файлу
      const extension = file.name.split('.').pop() || '';
      const key = `${folder}/${uuidv4()}.${extension}`;

      // Завантаження файлу
      const uploadResult = await this.s3
        .upload({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.type,
          ACL: 'public-read', // Дозволяє публічний доступ
        })
        .promise();

      return {
        success: true,
        url: uploadResult.Location,
        key: uploadResult.Key,
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during file upload',
      };
    }
  }

  /**
   * Видалити файл з S3
   */
  async deleteFile(key: string): Promise<boolean> {
    if (!this.bucket) {
      return false;
    }

    try {
      await this.s3
        .deleteObject({
          Bucket: this.bucket,
          Key: key,
        })
        .promise();

      return true;
    } catch (error) {
      console.error('File deletion error:', error);
      return false;
    }
  }

  /**
   * Отримати URL для публічного доступу до файлу
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  /**
   * Отримати URL з підписом для тимчасового доступу до приватного файлу
   */
  getSignedUrl(key: string, expiresInSeconds: number = 3600): string {
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresInSeconds,
    });
  }
}
