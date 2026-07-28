export type GetChatMediaParams = {
  /**
   * Фильтр по MIME-префиксу (image, video, audio)
   */
  type?: string;
  /**
   * Количество (по умолчанию 50)
   */
  limit?: number;
  /**
   * Смещение
   */
  offset?: number;
};
