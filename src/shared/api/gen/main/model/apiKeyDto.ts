export interface ApiKeyDto {
  id: string;
  name: string;
  /** Открытая часть ключа: по ней ключ узнают в списке. */
  prefix: string;
  scopes: string[];
  ownerId: string;
  /** @nullable */
  lastUsedAt: string | null;
  /** @nullable */
  expiresAt: string | null;
  /** @nullable */
  revokedAt: string | null;
  createdAt: string;
}
