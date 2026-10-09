/**
 * Выпуск агента в источнике: версия, откуда, когда проверен.
 */
export interface IAgentReleaseRemoteDto {
  version: string;
  /** `github:owner/repo` или ссылка на каталог выпуска. */
  from: string;
  /** Время проверки, мс. */
  checkedAt: number;
  /** Ключ, которым подписан выпуск (base64). */
  publicKey?: string;
}
