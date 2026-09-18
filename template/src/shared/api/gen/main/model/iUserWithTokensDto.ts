import type { IPermissionDto } from "./iPermissionDto";
import type { IRoleDto } from "./iRoleDto";
import type { ITokensDto } from "./iTokensDto";
import type { ProfileDto } from "./profileDto";

export interface IUserWithTokensDto {
  id: string;
  /** @nullable */
  email: string | null;
  emailVerified?: boolean;
  /** @nullable */
  phone: string | null;
  /** @nullable */
  username: string | null;
  profile?: ProfileDto;
  roles: IRoleDto[];
  directPermissions: IPermissionDto[];
  createdAt: string;
  updatedAt: string;
  tokens: ITokensDto;
}
