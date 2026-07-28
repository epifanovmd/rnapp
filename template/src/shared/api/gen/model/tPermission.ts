import type { KnownPermission } from "./knownPermission";

/**
 * Permission — произвольная строка; предопределённые значения дают автодополнение.
 */
export type TPermission = KnownPermission | string;
