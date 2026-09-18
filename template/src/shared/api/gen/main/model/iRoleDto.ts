import type { IPermissionDto } from "./iPermissionDto";
import type { TRole } from "./tRole";

export interface IRoleDto {
  id: string;
  name: TRole;
  createdAt: string;
  updatedAt: string;
  permissions: IPermissionDto[];
}
