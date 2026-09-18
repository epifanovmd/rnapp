export type ESyncEntityType =
  (typeof ESyncEntityType)[keyof typeof ESyncEntityType];

export const ESyncEntityType = {
  message: "message",
  chat: "chat",
  chat_member: "chat_member",
  contact: "contact",
  profile: "profile",
} as const;
