export type ResidentKeyRequirement =
  (typeof ResidentKeyRequirement)[keyof typeof ResidentKeyRequirement];

export const ResidentKeyRequirement = {
  discouraged: "discouraged",
  preferred: "preferred",
  required: "required",
} as const;
