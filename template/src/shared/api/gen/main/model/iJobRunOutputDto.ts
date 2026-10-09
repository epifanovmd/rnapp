/**
 * Файл итога задачи: подписанная ссылка на скачивание (GET, срок — `expiresAt`).
 */
export interface IJobRunOutputDto {
  /** Имя выхода задачи (`result`). */
  name: string;
  url: string;
  /** Размер, байт; неизвестен — нет поля. */
  size?: number;
  /** Ссылка действует до. */
  expiresAt: string;
}
