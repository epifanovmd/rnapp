import type { NodeDto } from "./nodeDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoNodeDto {
  items: NodeDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
