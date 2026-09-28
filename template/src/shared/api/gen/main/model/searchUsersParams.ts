export type SearchUsersParams = {
  /**
   * Поисковый запрос, минимум 2 символа
   */
  q: string;
  /**
   * Размер страницы: по умолчанию 20, не больше 100
   */
  limit?: number;
  /**
   * Смещение, по умолчанию 0
   */
  offset?: number;
};
