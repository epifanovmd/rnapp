import type { SessionDto } from "./sessionDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoSessionDto {
  items: SessionDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
