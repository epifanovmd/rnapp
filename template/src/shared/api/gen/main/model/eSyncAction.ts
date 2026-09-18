export type ESyncAction = (typeof ESyncAction)[keyof typeof ESyncAction];

export const ESyncAction = {
  create: "create",
  update: "update",
  delete: "delete",
} as const;
