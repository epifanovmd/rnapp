import type { EDevicePlatform } from "./eDevicePlatform";

export interface DeviceTokenDto {
  id: string;
  token: string;
  platform: EDevicePlatform;
  /** @nullable */
  deviceName: string | null;
  createdAt: string;
}
