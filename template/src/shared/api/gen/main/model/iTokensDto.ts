export interface ITokensDto {
  accessToken: string;
  refreshToken: string;
  /** Сколько секунд живёт access-токен (как `expires_in` в OAuth 2.0). */
  expiresIn: number;
  /** Сессия, к которой привязаны токены. */
  sessionId: string;
}
