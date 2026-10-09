import { KnownRole } from "@shared/api/gen/main/model";

/** Право — строка `домен:действие`, wildcard `домен:*` или полный доступ `*`. */
export type Permission = string;

/** Полный доступ. */
export const ALL_PERMISSIONS = "*";

/** Последний сегмент права «только на свои» сущности: `file:delete:own`. */
const OWN_SCOPE_SUFFIX = ":own";

/** Область действия права: над всеми сущностями или только над своими. */
export type AccessScope = "all" | "own";

/** Право «только на свои» для права на действие: `x:delete` → `x:delete:own`. */
export const ownPermission = (permission: Permission): Permission =>
  `${permission}${OWN_SCOPE_SUFFIX}`;

const matches = (
  userPerms: readonly Permission[],
  required: Permission,
): boolean => {
  if (userPerms.includes(required)) return true;

  const parts = required.split(":");

  for (let i = parts.length - 1; i >= 1; i--) {
    if (userPerms.includes([...parts.slice(0, i), "*"].join(":"))) return true;
  }

  return false;
};

/**
 * Проверяет наличие права с поддержкой wildcard-иерархии
 * (`user:update` ← `user:*` ← `*`). Право на действие над всеми сущностями
 * покрывает то же право «только на свои»: `x:delete` ⊃ `x:delete:own`.
 */
export const hasPermission = (
  userPerms: readonly Permission[],
  required: Permission,
): boolean => {
  if (userPerms.includes(ALL_PERMISSIONS) || matches(userPerms, required)) {
    return true;
  }

  return (
    required.endsWith(OWN_SCOPE_SUFFIX) &&
    matches(userPerms, required.slice(0, -OWN_SCOPE_SUFFIX.length))
  );
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

/**
 * Область права на действие: `all` — admin, само право или wildcard;
 * `own` — только `<право>:own`; `null` — права нет.
 */
export const resolveScope = (
  roles: readonly KnownRole[],
  userPerms: readonly Permission[],
  permission: Permission,
): AccessScope | null => {
  if (canAccess(roles, userPerms, permission)) return "all";

  return hasPermission(userPerms, ownPermission(permission)) ? "own" : null;
};

/** Вычисляет effective permissions = union(rolePermissions) ∪ directPermissions. */
export const computeEffectivePermissions = (
  rolePermissions: readonly Permission[],
  directPermissions: readonly Permission[],
): Permission[] => {
  return Array.from(new Set([...rolePermissions, ...directPermissions]));
};
