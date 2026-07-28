export type EChatMemberRole =
  (typeof EChatMemberRole)[keyof typeof EChatMemberRole];

export const EChatMemberRole = {
  owner: "owner",
  admin: "admin",
  member: "member",
  subscriber: "subscriber",
} as const;
