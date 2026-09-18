export type EMessageType = (typeof EMessageType)[keyof typeof EMessageType];

export const EMessageType = {
  text: "text",
  image: "image",
  file: "file",
  voice: "voice",
  system: "system",
  poll: "poll",
} as const;
