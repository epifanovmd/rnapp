import type { TPermission } from "./tPermission";

/**
 * Право в каталоге: имя и подпись.
 */
export interface IPermissionCatalogItemDto {
  name: TPermission;
  label: string;
  /**
   * Право «только на свои» (владелец или создатель) для этого действия;
   * нет — действие без области.
   */
  own?: TPermission;
}
