import { ApiResponse, CancelablePromise, iocDecorator } from "@force-dev/utils";

export const IProfileService = iocDecorator<IProfileService>();

export interface IProfileService {
  signIn(
    credentials: ISignInRequest,
  ): CancelablePromise<ApiResponse<ISignInResponse>>;

  // signUp(
  //   credentials: ISignUpRequest,
  // ): ApiAbortPromise<ApiResponse<ISignUpResponse>>;

  refresh(
    params: IRefreshTokenRequest,
  ): CancelablePromise<ApiResponse<IRefreshTokenResponse>>;

  getProfile(): CancelablePromise<ApiResponse<IProfile>>;
}

export interface IRefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface IProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  gender: string;
  image: string;
}

export interface ISignInRequest {
  username: string;
  password: string;
}

export interface ISignInResponse extends IProfile, IRefreshTokenResponse {}

export interface ISignUpRequest extends ISignInRequest {
  name: string;
}

export interface ISignUpResponse extends IProfile, IRefreshTokenResponse {}

export interface IRefreshTokenRequest {
  refreshToken: string;
}
