/**
 * Что делает задача узла.
 */
export type ENodeJobKind = (typeof ENodeJobKind)[keyof typeof ENodeJobKind];

export const ENodeJobKind = {
  install: "install",
  uninstall: "uninstall",
} as const;
