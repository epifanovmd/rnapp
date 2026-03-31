import { ApiError } from "@api";
import {
  ApiResponseDto,
  IProfileUpdateRequestDto,
  PrivacySettingsDto,
  ProfileDto,
  PublicProfileDto,
  UpdatePrivacySettingsPayload,
  UserDto,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { EntityHolder } from "@store";

export const IProfileStore = createServiceDecorator<IProfileStore>();

export interface IProfileStore {
  readonly profileHolder: EntityHolder<ProfileDto>;
  readonly privacyHolder: EntityHolder<PrivacySettingsDto>;

  loadMyProfile(): Promise<void>;
  updateProfile(
    data: IProfileUpdateRequestDto,
  ): Promise<ProfileDto | undefined>;
  loadPrivacy(): Promise<void>;
  updatePrivacy(
    data: UpdatePrivacySettingsPayload,
  ): Promise<PrivacySettingsDto | undefined>;
  setUsername(username: string): Promise<ApiResponse<UserDto, ApiError>>;
  changePassword(
    password: string,
  ): Promise<ApiResponse<ApiResponseDto, ApiError>>;
  requestVerifyEmail(): Promise<ApiResponse<boolean, ApiError>>;
  verifyEmail(code: string): Promise<ApiResponse<ApiResponseDto, ApiError>>;

  handleProfileUpdated(profile: PublicProfileDto): void;
}
