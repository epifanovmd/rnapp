import { KnownRole } from "@api/api-gen/data-contracts";

import { createEnumModelBase } from "../EnumModelBase";

const ROLE_MAP: Record<KnownRole, string> = {
  [KnownRole.Admin]: "Администратор",
  [KnownRole.User]: "Пользователь",
  [KnownRole.Guest]: "Гость",
};

const RoleModelBase = createEnumModelBase<typeof KnownRole>(KnownRole);

export class RoleModel extends RoleModelBase {
  get label() {
    return this.data && ROLE_MAP[this.data];
  }
}
