export type EMessageStatus =
  (typeof EMessageStatus)[keyof typeof EMessageStatus];

export const EMessageStatus = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
} as const;
