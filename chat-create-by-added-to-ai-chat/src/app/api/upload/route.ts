import { NextRequest, NextResponse } from 'next/server';
// Імпортуйте getServerSessionImpl правильно і використовуйте його
import { getServerSession as getServerSessionImpl } from 'next-auth/next';
import { nextAuthConfig } from '@/lib/auth';
import { S3FileUploadService } from '@/domains/message/infrastructure/services/fileUploadService';

/**
 * API маршрут для завантаження файлів
 */
export async function POST(req: NextRequest) {
  try {
    // Використовуємо імпортовану функцію
    const session = await getServerSessionImpl(nextAuthConfig);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Отримання файлу з формдати
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null; // 'chat', 'message', 'avatar'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Валідація типу файлу
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/zip',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'video/webm',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Валідація розміру файлу (10MB максимум)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File is too large (max 10MB)' }, { status: 400 });
    }

    // Конвертація File в Buffer для завантаження в S3
    const buffer = Buffer.from(await file.arrayBuffer());

    // Визначення папки для збереження файлу на основі типу
    let folder = 'uploads';
    if (type === 'avatar') {
      folder = 'avatars';
    } else if (type === 'chat') {
      folder = 'chats';
    } else if (type === 'message') {
      folder = 'messages';
    }

    // Завантаження файлу в S3
    const uploadService = new S3FileUploadService();
    const uploadResult = await uploadService.uploadFile(
      {
        name: file.name,
        type: file.type,
        size: file.size,
        buffer,
      },
      folder
    );

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error || 'Upload failed' }, { status: 500 });
    }

    // Успішне завантаження
    return NextResponse.json({
      url: uploadResult.url,
      key: uploadResult.key,
      name: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
