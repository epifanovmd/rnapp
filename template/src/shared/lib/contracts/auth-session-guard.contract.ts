import { createInjectDecorator } from "@shared/lib/di";

/**
 * Узкий контракт для доменов, которым нужно знать про текущую auth-сессию,
 * не завися от домена auth напрямую (Домен→Домен запрещён). Реализуется
 * тонким адаптером `AuthSessionGuard.service.ts` в domains/auth/services/.
 */
export interface IAuthSessionGuard {
  isCurrentSession(sessionId: string): boolean;
  signOut(): void;
}

export const IAuthSessionGuard =
  createInjectDecorator<IAuthSessionGuard>("IAuthSessionGuard");
