import { KnownPermission, KnownRole } from "@shared/api/gen/model";

/**
 * Проверяет наличие права с поддержкой wildcard-иерархии.
 * Иерархия wildcards: "contact:manage" → "contact:*" → "*".
 */
export function hasPermission(
  userPerms: KnownPermission[],
  required: KnownPermission,
): boolean {
  if (userPerms.includes(KnownPermission["*"])) return true;
  if (userPerms.includes(required)) return true;

  const parts = required.split(":");

  for (let i = parts.length - 1; i >= 1; i--) {
    const wildcard = [...parts.slice(0, i), "*"].join(":") as KnownPermission;

    if (userPerms.includes(wildcard)) return true;
  }

  return false;
}

/** Возвращает true, если пользователь имеет роль admin (superadmin bypass). */
export function isAdminRole(roles: KnownRole[]): boolean {
  return roles.includes(KnownRole.admin);
}

/** Проверяет доступ: admin bypass ИЛИ конкретное право. */
export function canAccess(
  roles: KnownRole[],
  userPerms: KnownPermission[],
  required: KnownPermission,
): boolean {
  return isAdminRole(roles) || hasPermission(userPerms, required);
}

/** Вычисляет effective permissions = union(rolePermissions) ∪ directPermissions. */
export function computeEffectivePermissions(
  rolePermissions: KnownPermission[],
  directPermissions: KnownPermission[],
): KnownPermission[] {
  return Array.from(new Set([...rolePermissions, ...directPermissions]));
}
