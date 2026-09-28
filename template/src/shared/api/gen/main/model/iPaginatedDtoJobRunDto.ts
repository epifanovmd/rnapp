import type { JobRunDto } from "./jobRunDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoJobRunDto {
  items: JobRunDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
