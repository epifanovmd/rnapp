import type { TPermission } from "./tPermission";

export interface IPermissionDto {
  id: string;
  name: TPermission;
  createdAt: string;
  updatedAt: string;
}
