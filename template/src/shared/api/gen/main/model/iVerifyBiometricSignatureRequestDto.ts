export interface IVerifyBiometricSignatureRequestDto {
  userId: string;
  deviceId: string;
  /** Nonce, выданный generate-nonce */
  nonce: string;
  /** Подпись nonce приватным ключом устройства (RSA-SHA256, base64) */
  signature: string;
}
