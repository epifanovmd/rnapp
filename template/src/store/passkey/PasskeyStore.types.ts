import { ApiError } from "@api";
import {
  AuthenticationResponseJSON,
  IVerifyAuthenticationRequestDto,
  IVerifyAuthenticationResponseDto,
  IVerifyRegistrationRequestDto,
  IVerifyRegistrationResponseDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";

export const IPasskeyStore = createServiceDecorator<IPasskeyStore>();

export interface IPasskeyStore {
  generateRegistrationOptions(): Promise<
    ApiResponse<PublicKeyCredentialCreationOptionsJSON, ApiError>
  >;
  verifyRegistration(
    data: IVerifyRegistrationRequestDto,
  ): Promise<ApiResponse<IVerifyRegistrationResponseDto, ApiError>>;
  generateAuthenticationOptions(
    email?: string,
  ): Promise<ApiResponse<PublicKeyCredentialRequestOptionsJSON, ApiError>>;
  verifyAuthentication(
    data: IVerifyAuthenticationRequestDto,
  ): Promise<ApiResponse<IVerifyAuthenticationResponseDto, ApiError>>;
}
