import type { AgentEnrollmentTokenDto } from "./agentEnrollmentTokenDto";

/**
 * Выпущенный токен: `token` показывается один раз.
 */
export interface ICreatedAgentEnrollmentTokenDto {
  enrollmentToken: AgentEnrollmentTokenDto;
  /** Полный токен `<prefix>.<secret>` — в настройки агента. */
  token: string;
}
