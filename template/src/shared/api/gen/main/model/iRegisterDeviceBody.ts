import type { EDevicePlatform } from "./eDevicePlatform";

export interface IRegisterDeviceBody {
  token: string;
  platform: EDevicePlatform;
  deviceName?: string;
}
