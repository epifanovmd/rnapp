export interface IDisable2FARequestDto {
  /** Текущий пароль аккаунта */
  currentPassword: string;
  /** Пароль второго фактора */
  password: string;
}
