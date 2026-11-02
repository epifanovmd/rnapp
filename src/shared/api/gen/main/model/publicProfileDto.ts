/**
 * Профиль глазами другого пользователя; ссылка на аватар — из карты подписей.
 */
export interface PublicProfileDto {
  id: string;
  userId: string;
  /** @nullable */
  firstName: string | null;
  /** @nullable */
  lastName: string | null;
  /** @nullable */
  lastOnline: string | null;
  /**
   * Подписанная ссылка на аватар; срок ограничен. `null` — аватара нет.
   * @nullable
   */
  avatarUrl: string | null;
}
