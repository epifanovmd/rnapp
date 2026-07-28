import type { PublicProfileDto } from "./publicProfileDto";

export interface PublicUserDto {
  userId: string;
  /** @nullable */
  email: string | null;
  /** @nullable */
  username: string | null;
  profile?: PublicProfileDto;
}
