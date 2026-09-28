export type PublicKeyCredentialType =
  (typeof PublicKeyCredentialType)[keyof typeof PublicKeyCredentialType];

export const PublicKeyCredentialType = {
  "public-key": "public-key",
} as const;
