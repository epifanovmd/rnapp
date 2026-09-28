import type { UserDto } from "./userDto";

/**
 * Список пользователей для администрирования (`user:view`).
 */
export interface IUserAdminListDto {
  items: UserDto[];
  /** Всего элементов, подходящих под фильтр. */
  total: number;
  offset: number;
  limit: number;
}
