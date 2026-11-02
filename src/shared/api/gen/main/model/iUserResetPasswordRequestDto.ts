export interface IUserResetPasswordRequestDto {
  /** Токен из письма сброса пароля */
  token: string;
  /** Новый пароль: от 8 символов, не email, не из списка частых */
  password: string;
}
