import type { ITokensDto } from "./iTokensDto";

export interface IVerifyAuthenticationResponseDto {
  verified: boolean;
  tokens?: ITokensDto;
}
