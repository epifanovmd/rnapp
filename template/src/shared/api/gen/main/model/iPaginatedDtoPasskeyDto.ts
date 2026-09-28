import type { PasskeyDto } from "./passkeyDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoPasskeyDto {
  items: PasskeyDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
