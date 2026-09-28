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
