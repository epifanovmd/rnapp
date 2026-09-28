import { KnownRole } from "@shared/api/gen/main/model";

/** Право — строка `домен:действие` или wildcard `домен:*`. */
export type Permission = string;

/** Полный доступ. */
export const ALL_PERMISSIONS = "*";

/**
 * Проверяет наличие права с поддержкой wildcard-иерархии.
 * Иерархия wildcards: "user:update" → "user:*" → "*".
 */
export const hasPermission = (
  userPerms: readonly Permission[],
  required: Permission,
): boolean => {
  if (userPerms.includes(ALL_PERMISSIONS)) return true;
  if (userPerms.includes(required)) return true;

  const parts = required.split(":");

  for (let i = parts.length - 1; i >= 1; i--) {
    if (userPerms.includes([...parts.slice(0, i), "*"].join(":"))) return true;
  }

  return false;
};

/** Возвращает true, если пользователь имеет роль admin (superadmin bypass). */
export const isAdminRole = (roles: readonly KnownRole[]): boolean => {
  return roles.includes(KnownRole.admin);
};

/** Проверяет доступ: admin bypass ИЛИ конкретное право. */
export const canAccess = (
  roles: readonly KnownRole[],
  userPerms: readonly Permission[],
  required: Permission,
): boolean => {
  return isAdminRole(roles) || hasPermission(userPerms, required);
};

/** Вычисляет effective permissions = union(rolePermissions) ∪ directPermissions. */
export const computeEffectivePermissions = (
  rolePermissions: readonly Permission[],
  directPermissions: readonly Permission[],
): Permission[] => {
  return Array.from(new Set([...rolePermissions, ...directPermissions]));
};
