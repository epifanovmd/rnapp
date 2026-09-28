import type { TPermission } from "./tPermission";

/**
 * Право в каталоге: имя и подпись.
 */
export interface IPermissionCatalogItemDto {
  name: TPermission;
  label: string;
}
