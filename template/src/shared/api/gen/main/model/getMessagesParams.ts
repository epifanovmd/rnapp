export type GetMessagesParams = {
  /**
   * ID сообщения — загрузить более старые
   */
  before?: string;
  /**
   * ID сообщения — загрузить более новые
   */
  after?: string;
  /**
   * ID сообщения — загрузить окно вокруг него
   */
  around?: string;
  /**
   * Количество сообщений (по умолчанию 50)
   */
  limit?: number;
};
