import type { PublicUserDto } from "./publicUserDto";

export interface IUserListDto {
  count?: number;
  totalCount?: number;
  offset?: number;
  limit?: number;
  data: PublicUserDto[];
}
