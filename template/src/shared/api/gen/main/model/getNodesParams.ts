export type GetNodesParams = {
  /**
   * Поиск по названию и адресу
   */
  query?: string;
  /**
   * Только свои узлы (владелец или создатель) при любой области прав
   */
  mine?: boolean;
  offset?: number;
  limit?: number;
};
