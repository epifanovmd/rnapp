import type { TPermission } from "./tPermission";
import type { TRole } from "./tRole";

export interface IUserPrivilegesRequestDto {
  /** Роли для назначения пользователю (заменяет текущие роли). */
  roles: TRole[];
  /**
   * Прямые разрешения, выданные этому пользователю дополнительно к разрешениям ролей.
   * Заменяет текущие прямые разрешения.
   */
  permissions: TPermission[];
}
