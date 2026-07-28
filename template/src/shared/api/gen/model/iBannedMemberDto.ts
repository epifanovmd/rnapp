export interface IBannedMemberDto {
  userId: string;
  chatId: string;
  reason?: string;
  bannedAt: string;
  expiresAt?: string;
}
