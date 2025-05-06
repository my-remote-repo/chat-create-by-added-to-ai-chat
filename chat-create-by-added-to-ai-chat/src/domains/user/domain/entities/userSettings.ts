export interface UserSettingsProps {
  id?: string;
  userId: string;
  theme: string;
  language: string;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserSettings {
  private readonly props: UserSettingsProps;

  constructor(props: UserSettingsProps) {
    this.props = {
      ...props,
      theme: props.theme || 'system',
      language: props.language || 'uk',
      notificationsEnabled: props.notificationsEnabled !== false,
      soundsEnabled: props.soundsEnabled !== false,
      desktopNotifications: props.desktopNotifications !== false,
      emailNotifications: props.emailNotifications !== false,
      showReadReceipts: props.showReadReceipts !== false,
      showOnlineStatus: props.showOnlineStatus !== false,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    };
  }

  // Геттери
  get id(): string | undefined {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get theme(): string {
    return this.props.theme;
  }

  get language(): string {
    return this.props.language;
  }

  get notificationsEnabled(): boolean {
    return this.props.notificationsEnabled;
  }

  get soundsEnabled(): boolean {
    return this.props.soundsEnabled;
  }

  get desktopNotifications(): boolean {
    return this.props.desktopNotifications;
  }

  get emailNotifications(): boolean {
    return this.props.emailNotifications;
  }

  get showReadReceipts(): boolean {
    return this.props.showReadReceipts;
  }

  get showOnlineStatus(): boolean {
    return this.props.showOnlineStatus;
  }

  get createdAt(): Date | undefined {
    return this.props.createdAt;
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt;
  }

  // Бізнес-методи для оновлення налаштувань
  public update(settings: Partial<UserSettingsProps>): UserSettings {
    return new UserSettings({
      ...this.props,
      ...settings,
      updatedAt: new Date(),
    });
  }

  // DTO для API
  public toDTO(): UserSettingsDTO {
    return {
      userId: this.userId,
      theme: this.theme,
      language: this.language,
      notificationsEnabled: this.notificationsEnabled,
      soundsEnabled: this.soundsEnabled,
      desktopNotifications: this.desktopNotifications,
      emailNotifications: this.emailNotifications,
      showReadReceipts: this.showReadReceipts,
      showOnlineStatus: this.showOnlineStatus,
    };
  }
}

export interface UserSettingsDTO {
  userId: string;
  theme: string;
  language: string;
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  desktopNotifications: boolean;
  emailNotifications: boolean;
  showReadReceipts: boolean;
  showOnlineStatus: boolean;
}
