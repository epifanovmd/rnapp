import type { RecordStringString } from "./recordStringString";

export interface AgentEnrollmentTokenDto {
  id: string;
  name: string;
  /** Открытая часть токена: по ней токен узнают в списке. */
  prefix: string;
  labels: RecordStringString;
  /** @nullable */
  maxUses: number | null;
  uses: number;
  /** @nullable */
  expiresAt: string | null;
  /** @nullable */
  revokedAt: string | null;
  /** @nullable */
  createdBy: string | null;
  createdAt: string;
}
