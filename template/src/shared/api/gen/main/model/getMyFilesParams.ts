export type GetMyFilesParams = {
  /**
   * Только свои файлы (по умолчанию `true`)
   */
  mine?: boolean;
  /**
   * Смещение
   */
  offset?: number;
  /**
   * Размер страницы (до 100)
   */
  limit?: number;
};
