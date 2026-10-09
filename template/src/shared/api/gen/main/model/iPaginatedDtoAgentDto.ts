import type { AgentDto } from "./agentDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoAgentDto {
  items: AgentDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
