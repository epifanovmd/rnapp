export type ECallType = (typeof ECallType)[keyof typeof ECallType];

export const ECallType = {
  voice: "voice",
  video: "video",
} as const;
