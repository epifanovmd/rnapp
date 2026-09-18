export type AttestationConveyancePreference =
  (typeof AttestationConveyancePreference)[keyof typeof AttestationConveyancePreference];

export const AttestationConveyancePreference = {
  direct: "direct",
  enterprise: "enterprise",
  indirect: "indirect",
  none: "none",
} as const;
