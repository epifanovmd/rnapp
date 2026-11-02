import type { Uuid } from "./uuid";

export interface IProfileUpdateRequestDto {
  /**
   * @maxLength 40
   * @nullable
   */
  firstName?: string | null;
  /**
   * @maxLength 40
   * @nullable
   */
  lastName?: string | null;
  /** @nullable */
  birthDate?: string | null;
  /**
   * @maxLength 20
   * @nullable
   */
  gender?: string | null;
  /**
   * Язык пользователя: `ru`, `en`, `en-US`. Письма — на `ru`/`en`, прочие
   * языки получают письма на `ru`.
   * @maxLength 10
   * @nullable
   */
  locale?: string | null;
  /**
   * Аватар: id своего загруженного изображения (`POST /api/v1/file`);
   * `null` — снять аватар.
   */
  avatarId?: Uuid | null;
}
