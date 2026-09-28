/**
 * Passkey пользователя — без ключа и счётчика.
 */
export interface PasskeyDto {
  /** Credential ID (Base64URL) */
  id: string;
  deviceType: string;
  /** @nullable */
  transports: string[] | null;
  /** @nullable */
  lastUsed: string | null;
  createdAt: string;
}
