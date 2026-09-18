export type GetUsersParams = {
  /**
   * Смещение для пагинации
   */
  offset?: number;
  /**
   * Лимит количества возвращаемых пользователей
   */
  limit?: number;
  /**
   * Поиск по email
   */
  query?: string;
};
