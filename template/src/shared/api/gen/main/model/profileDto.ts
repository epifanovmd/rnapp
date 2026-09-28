import type { IFileDto } from "./iFileDto";
import type { UserDto } from "./userDto";

/**
 * Профиль владельца; ссылки на аватар — из карты подписей `files`.
 */
export interface ProfileDto {
  id: string;
  userId: string;
  /** @nullable */
  firstName: string | null;
  /** @nullable */
  lastName: string | null;
  /** @nullable */
  birthDate: string | null;
  /** @nullable */
  gender: string | null;
  /** @nullable */
  locale: string | null;
  /** @nullable */
  lastOnline: string | null;
  createdAt: string;
  updatedAt: string;
  /** Аватар с подписанными ссылками; нет аватара или связь не загружена — поля нет. */
  avatar?: IFileDto;
  user?: UserDto;
}
