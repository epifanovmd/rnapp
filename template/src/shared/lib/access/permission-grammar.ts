/** Право — строка `домен:действие`, wildcard `домен:*` или полный доступ `*`. */
export type Permission = string;

/** Полный доступ. */
export const ALL_PERMISSIONS = "*";

/** Последний сегмент права «только на свои» сущности: `wg:peer:update:own`. */
const OWN_SCOPE_SUFFIX = ":own";

/** Область действия права: над всеми сущностями или только над своими. */
export type AccessScope = "all" | "own";

/** Право «только на свои» для права на действие: `x:update` → `x:update:own`. */
export const ownPermission = (permission: Permission): Permission =>
  `${permission}${OWN_SCOPE_SUFFIX}`;

const matches = (
  granted: readonly Permission[],
  required: Permission,
): boolean => {
  if (granted.includes(required)) return true;

  const parts = required.split(":");

  for (let i = parts.length - 1; i >= 1; i--) {
    if (granted.includes([...parts.slice(0, i), "*"].join(":"))) return true;
  }

  return false;
};

/**
 * Покрывает ли набор право с учётом wildcard-иерархии
 * (`wg:peer:create` ← `wg:peer:*` ← `wg:*` ← `*`). Право на действие над
 * всеми сущностями покрывает то же право «только на свои»:
 * `x:update` ⊃ `x:update:own`.
 */
export const hasPermission = (
  granted: readonly Permission[],
  required: Permission,
): boolean => {
  if (granted.includes(ALL_PERMISSIONS) || matches(granted, required)) {
    return true;
  }

  return (
    required.endsWith(OWN_SCOPE_SUFFIX) &&
    matches(granted, required.slice(0, -OWN_SCOPE_SUFFIX.length))
  );
};

/** Область права в наборе: на все, только на свои или нет права. */
export const scopeIn = (
  granted: readonly Permission[],
  required: Permission,
): AccessScope | null => {
  if (hasPermission(granted, required)) return "all";

  return hasPermission(granted, ownPermission(required)) ? "own" : null;
};
