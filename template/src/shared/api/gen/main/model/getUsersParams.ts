export type GetUsersParams = {
  /**
   * Смещение, по умолчанию 0
   */
  offset?: number;
  /**
   * Размер страницы: по умолчанию 20, не больше 100
   */
  limit?: number;
  /**
   * Поиск по email, минимум 2 символа
   */
  query?: string;
};
