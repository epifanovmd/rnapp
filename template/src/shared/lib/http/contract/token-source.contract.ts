/**
 * Откуда `bearerAuth` берёт токен и как просит его обновить. Реализует
 * `lib/session`, связывает их модуль конкретного бэкенда.
 */
export interface ITokenSource {
  readonly accessToken: string;

  ensureFreshToken(): Promise<void>;
  refreshToken(): Promise<void>;
}
