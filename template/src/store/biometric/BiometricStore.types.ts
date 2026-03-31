import { ApiError } from "@api";
import {
  IBiometricDeviceDto,
  IDeleteBiometricResponseDto,
  IGenerateNonceResponseDto,
  IRegisterBiometricResponseDto,
  IVerifyBiometricSignatureResponseDto,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { CollectionHolder } from "@store";

export const IBiometricStore = createServiceDecorator<IBiometricStore>();

export interface IBiometricStore {
  readonly devicesHolder: CollectionHolder<IBiometricDeviceDto>;

  loadDevices(): Promise<void>;
  registerBiometric(data: {
    deviceId: string;
    deviceName: string;
    publicKey: string;
  }): Promise<ApiResponse<IRegisterBiometricResponseDto, ApiError>>;
  generateNonce(
    deviceId: string,
  ): Promise<ApiResponse<IGenerateNonceResponseDto, ApiError>>;
  verifySignature(data: {
    deviceId: string;
    signature: string;
    nonce: string;
  }): Promise<ApiResponse<IVerifyBiometricSignatureResponseDto, ApiError>>;
  deleteDevice(
    deviceId: string,
  ): Promise<ApiResponse<IDeleteBiometricResponseDto, ApiError>>;
}
