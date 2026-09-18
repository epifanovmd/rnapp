import type { IVerifyBiometricSignatureResponseDtoTokens } from "./iVerifyBiometricSignatureResponseDtoTokens";

export interface IVerifyBiometricSignatureResponseDto {
  verified: boolean;
  tokens: IVerifyBiometricSignatureResponseDtoTokens;
}
