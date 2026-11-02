import type { ApiKeyDto } from "./apiKeyDto";

/**
 * Страница по смещению: списки с известным общим числом.
 */
export interface IPaginatedDtoApiKeyDto {
  items: ApiKeyDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
