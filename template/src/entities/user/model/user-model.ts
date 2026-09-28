import {
  KnownPermission,
  KnownRole,
  UserDto,
} from "@shared/api/gen/main/model";
import { DataModelBase } from "@shared/lib/models";
import { DateModel } from "@shared/lib/models/date";
import { formatFullName, formatInitials } from "@shared/lib/utils";
import { LambdaValue } from "@shared/lib/utils/lambda-value";
import { computed, makeObservable } from "mobx";

import { computeEffectivePermissions, isAdminRole } from "../lib/permissions";

export class UserModel extends DataModelBase<UserDto> {
  public readonly createdAtDate = new DateModel(() => this.data.createdAt);
  public readonly updatedAtDate = new DateModel(() => this.data.updatedAt);
  public readonly lastOnlineDate = new DateModel(
    () => this.data.profile?.lastOnline,
  );

  constructor(data: LambdaValue<UserDto>) {
    super(data);
    makeObservable(this, {
      displayName: computed,
      initials: computed,
      avatarUrl: computed,
      avatarId: computed,
      login: computed,
      roleNames: computed,
      directPermissionNames: computed,
      effectivePermissions: computed,
      isAdmin: computed,
      roleLabel: computed,
      formattedCreatedAt: computed,
      formattedUpdatedAt: computed,
      formattedLastOnline: computed,
    });
  }

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

  /** Ссылка на аватар: превью, если готово, иначе оригинал. */
  get avatarUrl(): string | undefined {
    const avatar = this.data.profile?.avatar;

    return avatar?.thumbnailUrl ?? avatar?.url ?? undefined;
  }

  get avatarId(): string | undefined {
    return this.data.profile?.avatar?.id;
  }

  get login() {
    return this.data.email ?? this.data.phone;
  }

  /** Роли пользователя (массив KnownRole) */
  get roleNames(): KnownRole[] {
    return this.data.roles.map(r => r.name as KnownRole);
  }

  /** Прямые права пользователя */
  get directPermissionNames(): KnownPermission[] {
    return this.data.directPermissions.map(p => p.name as KnownPermission);
  }

  /** Effective permissions = union(роль.permissions) + directPermissions */
  get effectivePermissions(): KnownPermission[] {
    const rolePerms = this.data.roles.flatMap(r =>
      r.permissions.map(p => p.name as KnownPermission),
    );

    return computeEffectivePermissions(rolePerms, this.directPermissionNames);
  }

  get isAdmin(): boolean {
    return isAdminRole(this.roleNames);
  }

  /** Отображаемое имя первой роли */
  get roleLabel() {
    return this.data.roles[0]?.name ?? KnownRole.user;
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
