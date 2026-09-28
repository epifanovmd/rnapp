import type { ApiKeyDto } from "./apiKeyDto";

/**
 * Созданный ключ: `key` показывается один раз и больше не восстановим.
 */
export interface ICreatedApiKeyDto {
  apiKey: ApiKeyDto;
  /** Полный ключ `<prefix>.<secret>` — передаётся в `X-Api-Key`. */
  key: string;
}
