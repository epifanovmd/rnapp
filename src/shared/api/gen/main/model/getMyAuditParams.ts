export type GetMyAuditParams = {
  /**
   * Курсор следующей страницы (`nextCursor` предыдущего ответа)
   */
  cursor?: string;
  /**
   * Размер страницы (по умолчанию 20, максимум 100)
   */
  limit?: number;
  /**
   * Фильтр по типу события
   */
  type?: string;
};
