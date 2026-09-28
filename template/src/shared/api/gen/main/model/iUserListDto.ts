import type { PublicUserDto } from "./publicUserDto";

export interface IUserListDto {
  items: PublicUserDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
