import { KnownRole } from "@shared/api/gen/model";
import { createEnumModelBase } from "@shared/lib/models";

const ROLE_MAP: Record<KnownRole, string> = {
  [KnownRole.admin]: "Администратор",
  [KnownRole.user]: "Пользователь",
  [KnownRole.guest]: "Гость",
};

const RoleModelBase = createEnumModelBase<typeof KnownRole>(KnownRole);

export class RoleModel extends RoleModelBase {
  get label() {
    return this.data && ROLE_MAP[this.data];
  }
}
