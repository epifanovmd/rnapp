export interface IEnable2FARequestDto {
  /** Текущий пароль аккаунта */
  currentPassword: string;
  /** Пароль второго фактора */
  password: string;
  hint?: string;
}
