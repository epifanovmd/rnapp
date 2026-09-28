import type { ITokensDto } from "./iTokensDto";

export interface IVerifyBiometricSignatureResponseDto {
  verified: boolean;
  tokens: ITokensDto;
}
