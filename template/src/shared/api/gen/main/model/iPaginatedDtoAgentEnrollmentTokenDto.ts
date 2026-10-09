import type { AgentEnrollmentTokenDto } from "./agentEnrollmentTokenDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoAgentEnrollmentTokenDto {
  items: AgentEnrollmentTokenDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
