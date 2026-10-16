import { createInjectDecorator } from "@shared/lib/di";

/**
 * Узкий контракт текущей auth-сессии для слайсов, которым нельзя зависеть от
 * слайса авторизации напрямую. Реализацию биндит владелец сессии.
 */
export interface IAuthSessionGuard {
  isCurrentSession(sessionId: string): boolean;
  signOut(): void;
}

export const IAuthSessionGuard =
  createInjectDecorator<IAuthSessionGuard>("IAuthSessionGuard");
