export type AuthenticatorAttachment =
  (typeof AuthenticatorAttachment)[keyof typeof AuthenticatorAttachment];

export const AuthenticatorAttachment = {
  "cross-platform": "cross-platform",
  platform: "platform",
} as const;
