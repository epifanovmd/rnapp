export type GetSessionsParams = {
  /**
   * Смещение (по умолчанию 0)
   */
  offset?: number;
  /**
   * Размер страницы (по умолчанию 20, максимум 100)
   */
  limit?: number;
};
