import type { Uuid } from "./uuid";

export type ListAuditEventsParams = {
  /**
   * Курсор следующей страницы
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
  /**
   * Фильтр по пользователю
   */
  actorId?: Uuid;
};
