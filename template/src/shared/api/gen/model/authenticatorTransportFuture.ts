/**
 * A super class of TypeScript's `AuthenticatorTransport` that includes support for the latest
 * transports. Should eventually be replaced by TypeScript's when TypeScript gets updated to
 * know about it (sometime after 4.6.3)
 */
export type AuthenticatorTransportFuture =
  (typeof AuthenticatorTransportFuture)[keyof typeof AuthenticatorTransportFuture];

export const AuthenticatorTransportFuture = {
  ble: "ble",
  cable: "cable",
  hybrid: "hybrid",
  internal: "internal",
  nfc: "nfc",
  "smart-card": "smart-card",
  usb: "usb",
} as const;
