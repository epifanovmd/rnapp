import type { IPermissionDto } from "./iPermissionDto";
import type { IRoleDto } from "./iRoleDto";
import type { ProfileDto } from "./profileDto";

/**
 * Пользователь для владельца и администрирования; аватар — из карты подписей.
 */
export interface UserDto {
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
}
