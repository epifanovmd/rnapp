export interface IBiometricDeviceDto {
  id: string;
  deviceId: string;
  /** @nullable */
  deviceName: string | null;
  /** @nullable */
  lastUsedAt: string | null;
  createdAt: string;
}
