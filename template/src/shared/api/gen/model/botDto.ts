export interface BotDto {
  id: string;
  username: string;
  displayName: string;
  /** @nullable */
  description: string | null;
  /** @nullable */
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
}
