import { ApiError } from "@api";
import {
  ApiResponseDto,
  ISignInRequestDto,
  ISignInResponseDto,
  ITokensDto,
  IUserWithTokensDto,
  KnownPermission,
  KnownRole,
  TSignUpRequestDto,
  UserDto,
} from "@api/api-gen/data-contracts";
import { ApiResponse } from "@api/api-gen/http-client";
import { createServiceDecorator } from "@di";
import { IEntityHolderResult, IHolderError } from "@store";
import { ProfileModel } from "@store/models";

export enum AuthStatus {
  Idle = "idle",
  Loading = "loading",
  Authenticated = "authenticated",
  Unauthenticated = "unauthenticated",
}

export const IAuthStore = createServiceDecorator<IAuthStore>();

export interface IAuthStore {
  readonly status: AuthStatus;
  readonly user: UserDto | null;
  readonly profile: ProfileModel | null;
  readonly error: string | undefined;
  readonly isIdle: boolean;
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly roles: KnownRole[];
  readonly directPermissions: KnownPermission[];
  readonly permissions: KnownPermission[];
  readonly isAdmin: boolean;

  hasPermission(required: KnownPermission): boolean;

  load(): Promise<IEntityHolderResult<UserDto, IHolderError>>;
  signIn(params: ISignInRequestDto): Promise<ISignInResponseDto | undefined>;
  signUp(params: TSignUpRequestDto): Promise<void>;
  restore(tokens?: ITokensDto): Promise<void>;
  signOut(): void;
  deleteMyAccount(): Promise<void>;

  // Password reset
  requestResetPassword(
    email: string,
  ): Promise<ApiResponse<ApiResponseDto, ApiError>>;
  resetPassword(
    token: string,
    password: string,
  ): Promise<ApiResponse<ApiResponseDto, ApiError>>;

  // 2FA
  enable2Fa(
    password: string,
    hint?: string,
  ): Promise<ApiResponse<ApiResponseDto, ApiError>>;
  disable2Fa(password: string): Promise<ApiResponse<ApiResponseDto, ApiError>>;
  verify2Fa(
    twoFactorToken: string,
    password: string,
  ): Promise<ApiResponse<IUserWithTokensDto, ApiError>>;
}
