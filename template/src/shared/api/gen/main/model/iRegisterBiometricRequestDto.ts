export interface IRegisterBiometricRequestDto {
  deviceId: string;
  deviceName: string;
  /** Публичный ключ устройства (SPKI DER в base64) */
  publicKey: string;
}
