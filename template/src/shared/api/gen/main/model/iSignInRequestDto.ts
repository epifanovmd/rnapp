export interface ISignInRequestDto {
  /** Может быть телефоном, email-ом и username-ом */
  login: string;
  password: string;
}
