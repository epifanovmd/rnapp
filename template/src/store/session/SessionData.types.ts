import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";

import { IRefreshTokenResponse, ISignInRequest } from "~@service";

export const ISessionDataStore = createServiceDecorator<ISessionDataStore>();

export interface ISessionDataStore extends SupportInitialize {
  isLoading: boolean;
  isAuthorized: boolean;

  updateToken(
    refreshToken?: string,
  ): Promise<Record<keyof IRefreshTokenResponse, string | null>>;
  signIn(params: ISignInRequest): Promise<void>;
  // signUp(params: TSignUpRequest): Promise<void>;
  restore(tokens?: IRefreshTokenResponse): Promise<void>;
  clear(): void;
}
