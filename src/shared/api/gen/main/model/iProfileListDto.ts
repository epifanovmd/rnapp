import type { PublicProfileDto } from "./publicProfileDto";

export interface IProfileListDto {
  items: PublicProfileDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
