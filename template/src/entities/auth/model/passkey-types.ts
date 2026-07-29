import { ApiError } from "@shared/api";
import {
  IVerifyAuthenticationRequestDto,
  IVerifyAuthenticationResponseDto,
  IVerifyRegistrationRequestDto,
  IVerifyRegistrationResponseDto,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@shared/api/gen/model";
import { ApiResponse } from "@shared/api/http.types";
import { createInjectDecorator } from "@shared/lib/di";

export const IPasskeyStore =
  createInjectDecorator<IPasskeyStore>("IPasskeyStore");

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
