import type { RecordStringUnknown } from "./recordStringUnknown";

/**
 * Событие журнала безопасности.
 */
export interface AuditEventDto {
  id: string;
  /** Тип: `auth.login.succeeded`, `session.terminated`, … */
  type: string;
  /** @nullable */
  actorId: string | null;
  /** @nullable */
  subjectId: string | null;
  /** @nullable */
  ip: string | null;
  /** @nullable */
  userAgent: string | null;
  meta: RecordStringUnknown;
  createdAt: string;
}
