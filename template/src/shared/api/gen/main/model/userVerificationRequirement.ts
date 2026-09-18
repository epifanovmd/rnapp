export type UserVerificationRequirement =
  (typeof UserVerificationRequirement)[keyof typeof UserVerificationRequirement];

export const UserVerificationRequirement = {
  discouraged: "discouraged",
  preferred: "preferred",
  required: "required",
} as const;
