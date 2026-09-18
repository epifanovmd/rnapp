import type { KnownRole } from "./knownRole";

/**
 * Роль — произвольная строка; предопределённые значения дают автодополнение.
 */
export type TRole = KnownRole | string;
