import {
  KnownPermission,
  KnownRole,
  UserDto,
} from "@api/api-gen/data-contracts";
import { computeEffectivePermissions, isAdminRole } from "@core/permissions";
import { formatFullName, formatInitials } from "@utils";

import { TypedModel } from "../DataModelBase";
import { DateModel } from "../date";

export class UserModel extends TypedModel<UserDto>() {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);
  public readonly updatedAtDate = new DateModel(() => this.data.updatedAt);
  public readonly lastOnlineDate = new DateModel(
    () => this.data.profile?.lastOnline,
  );

  get displayName() {
    const p = this.data.profile;

    return formatFullName(
      p?.firstName,
      p?.lastName,
      this.data.email || this.data.phone || "Unknown",
    );
  }

  get initials() {
    const p = this.data.profile;

    return formatInitials(
      p?.firstName,
      p?.lastName,
      this.data.email?.[0] ?? "U",
    );
  }

  get login() {
    return this.data.email ?? this.data.phone;
  }

  /** Роли пользователя (массив KnownRole) */
  get roleNames(): KnownRole[] {
    return this.data.roles.map(r => r.name);
  }

  /** Прямые права пользователя */
  get directPermissionNames(): KnownPermission[] {
    return this.data.directPermissions.map(p => p.name);
  }

  /** Effective permissions = union(роль.permissions) + directPermissions */
  get effectivePermissions(): KnownPermission[] {
    const rolePerms = this.data.roles.flatMap(r =>
      r.permissions.map(p => p.name),
    );

    return computeEffectivePermissions(rolePerms, this.directPermissionNames);
  }

  get isAdmin(): boolean {
    return isAdminRole(this.roleNames);
  }

  /** Отображаемое имя первой роли */
  get roleLabel() {
    return this.data.roles[0]?.name ?? KnownRole.User;
  }

  get formattedCreatedAt() {
    return this.createdAtDate.formattedDate;
  }

  get formattedUpdatedAt() {
    return this.updatedAtDate.formattedDate;
  }

  get formattedLastOnline() {
    return this.lastOnlineDate.data
      ? this.lastOnlineDate.formattedDate
      : undefined;
  }
}
