export interface ChatInviteDto {
  id: string;
  chatId: string;
  code: string;
  createdById: string;
  /** @nullable */
  expiresAt: string | null;
  /** @nullable */
  maxUses: number | null;
  useCount: number;
  isActive: boolean;
  createdAt: string;
}
