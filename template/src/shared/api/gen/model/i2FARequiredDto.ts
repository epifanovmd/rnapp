export interface I2FARequiredDto {
  require2FA: true;
  twoFactorToken: string;
  twoFactorHint?: string;
}
