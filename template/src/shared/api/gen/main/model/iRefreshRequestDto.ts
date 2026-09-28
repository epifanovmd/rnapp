export interface IRefreshRequestDto {
  /** Refresh-токен; без него берётся из cookie `refresh_token` (если включена). */
  refreshToken?: string;
}
