import { KnownPermission, KnownRole } from "@api/api-gen/data-contracts";

/**
 * Проверяет наличие права с поддержкой wildcard-иерархии.
 * Зеркалит логику TokenService.hasPermission() на бэкенде.
 *
 * Иерархия wildcards:
 *   "wg:server:view" → проверяет "wg:server:*" → "wg:*" → "*"
 *   "wg:peer:manage" → проверяет "wg:peer:*"  → "wg:*" → "*"
 */
export function hasPermission(
  userPerms: KnownPermission[],
  required: KnownPermission,
): boolean {
  if (userPerms.includes(KnownPermission.Value)) return true;
  if (userPerms.includes(required)) return true;

  const parts = required.split(":");

  for (let i = parts.length - 1; i >= 1; i--) {
    const wildcard = [...parts.slice(0, i), "*"].join(":") as KnownPermission;

    if (userPerms.includes(wildcard)) return true;
  }

  return false;
}

/**
 * Возвращает true если пользователь имеет роль ADMIN (superadmin bypass).
 */
export function isAdminRole(roles: KnownRole[]): boolean {
  return roles.includes(KnownRole.Admin);
}

/**
 * Проверяет доступ: admin bypass ИЛИ конкретное право.
 */
export function canAccess(
  roles: KnownRole[],
  userPerms: KnownPermission[],
  required: KnownPermission,
): boolean {
  return isAdminRole(roles) || hasPermission(userPerms, required);
}

/**
 * Вычисляет effective permissions = union(rolePermissions) ∪ directPermissions.
 * Дедуплицирует результат.
 */
export function computeEffectivePermissions(
  rolePermissions: KnownPermission[],
  directPermissions: KnownPermission[],
): KnownPermission[] {
  return Array.from(new Set([...rolePermissions, ...directPermissions]));
}
