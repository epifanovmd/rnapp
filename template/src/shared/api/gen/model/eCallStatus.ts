export type ECallStatus = (typeof ECallStatus)[keyof typeof ECallStatus];

export const ECallStatus = {
  ringing: "ringing",
  active: "active",
  ended: "ended",
  missed: "missed",
  declined: "declined",
} as const;
