/**
 * Властивості файлу
 */
export interface FileProps {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    messageId?: string | null;
    chatId?: string | null;
    userId: string;
    createdAt: Date;
  }
  
  /**
   * Доменна модель файлу
   */
  export class File {
    private readonly props: FileProps;
  
    constructor(props: FileProps) {
      this.props = props;
    }
  
    // Геттери
    get id(): string {
      return this.props.id;
    }
  
    get name(): string {
      return this.props.name;
    }
  
    get url(): string {
      return this.props.url;
    }
  
    get size(): number {
      return this.props.size;
    }
  
    get type(): string {
      return this.props.type;
    }
  
    get messageId(): string | null | undefined {
      return this.props.messageId;
    }
  
    get chatId(): string | null | undefined {
      return this.props.chatId;
    }
  
    get userId(): string {
      return this.props.userId;
    }
  
    get createdAt(): Date {
      return this.props.createdAt;
    }
  
    // Перевірка типу файлу
    public isImage(): boolean {
      return this.type.startsWith('image/');
    }
  
    public isVideo(): boolean {
      return this.type.startsWith('video/');
    }
  
    public isAudio(): boolean {
      return this.type.startsWith('audio/');
    }
  
    public isDocument(): boolean {
      return !this.isImage() && !this.isVideo() && !this.isAudio();
    }
  
    // Отримання розширення файлу
    public getExtension(): string {
      const parts = this.name.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
    }
  
    // Форматування розміру файлу (в KB, MB)
    public formatSize(): string {
      if (this.size < 1024) {
        return `${this.size} B`;
      } else if (this.size < 1024 * 1024) {
        return `${Math.round(this.size / 1024)} KB`;
      } else {
        return `${Math.round(this.size / (1024 * 1024) * 10) / 10} MB`;
      }
    }
  
    // Трансформація в DTO для публічного API
    public toDTO(): FileDTO {
      return {
        id: this.id,
        name: this.name,
        url: this.url,
        size: this.size,
        type: this.type,
        messageId: this.messageId,
        chatId: this.chatId,
        userId: this.userId,
        createdAt: this.createdAt,
        formattedSize: this.formatSize(),
        isImage: this.isImage(),
        isVideo: this.isVideo(),
        isAudio: this.isAudio(),
        isDocument: this.isDocument(),
        extension: this.getExtension(),
      };
    }
  }
  
  // DTO для безпечної передачі даних через API
  export interface FileDTO {
    id: string;
    name: string;
    url: string;
    size: number;
    type: string;
    messageId?: string | null;
    chatId?: string | null;
    userId: string;
    createdAt: Date;
    formattedSize: string;
    isImage: boolean;
    isVideo: boolean;
    isAudio: boolean;
    isDocument: boolean;
    extension: string;
  }