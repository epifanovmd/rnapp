export type EChatType = (typeof EChatType)[keyof typeof EChatType];

export const EChatType = {
  direct: "direct",
  group: "group",
  channel: "channel",
} as const;
