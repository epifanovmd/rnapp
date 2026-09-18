export type EDevicePlatform =
  (typeof EDevicePlatform)[keyof typeof EDevicePlatform];

export const EDevicePlatform = {
  ios: "ios",
  android: "android",
  web: "web",
} as const;
