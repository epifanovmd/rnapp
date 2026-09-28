import type { PermissionName } from "./permissionName";
import type { RoleName } from "./roleName";

export interface IUserPrivilegesRequestDto {
  /** Роли для назначения пользователю (заменяет текущие роли). */
  roles: RoleName[];
  /**
   * Прямые разрешения, выданные этому пользователю дополнительно к разрешениям ролей.
   * Заменяет текущие прямые разрешения.
   */
  permissions: PermissionName[];
}
