import type { IFileDto } from "./iFileDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoIFileDto {
  items: IFileDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
