export type EPrivacyLevel = (typeof EPrivacyLevel)[keyof typeof EPrivacyLevel];

export const EPrivacyLevel = {
  everyone: "everyone",
  contacts: "contacts",
  nobody: "nobody",
} as const;
