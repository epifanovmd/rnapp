/**
 * Версия агента в источнике: какая, откуда, когда проверена.
 */
export interface IAgentReleaseRemoteDto {
  version: string;
  /** `github:owner/repo` или ссылка на каталог сборок. */
  from: string;
  /** Время проверки, мс. */
  checkedAt: number;
  /** Ключ, которым подписаны сборки (base64). */
  publicKey?: string;
}
