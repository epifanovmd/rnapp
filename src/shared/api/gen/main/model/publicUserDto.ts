import type { PublicProfileDto } from "./publicProfileDto";

/**
 * Пользователь глазами другого пользователя: без email, телефон — по приватности.
 */
export interface PublicUserDto {
  userId: string;
  /** @nullable */
  username: string | null;
  /** @nullable */
  phone: string | null;
  profile?: PublicProfileDto;
}
