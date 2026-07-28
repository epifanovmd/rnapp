export type EContactStatus =
  (typeof EContactStatus)[keyof typeof EContactStatus];

export const EContactStatus = {
  pending: "pending",
  accepted: "accepted",
  blocked: "blocked",
} as const;
