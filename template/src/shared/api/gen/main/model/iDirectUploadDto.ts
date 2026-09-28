import type { RecordStringString } from "./recordStringString";

/**
 * Выданная прямая загрузка: `PUT uploadUrl` с заголовками `headers`, затем `complete`.
 */
export interface IDirectUploadDto {
  fileId: string;
  uploadUrl: string;
  /** Заголовки, обязательные для `PUT` (входят в подпись). */
  headers: RecordStringString;
  expiresAt: string;
}
