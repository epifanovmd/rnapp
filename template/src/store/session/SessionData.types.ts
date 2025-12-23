import {
  AuthenticatePayload,
  ISignInRequest,
  ITokensDto,
  TSignUpRequest,
} from "@api/api-gen/data-contracts";
import { createServiceDecorator, SupportInitialize } from "@force-dev/utils";

export const ISessionDataStore = createServiceDecorator<ISessionDataStore>();

export interface ISessionDataStore extends SupportInitialize {
  isLoading: boolean;
  isAuthorized: boolean;

  updateToken(
    refreshToken?: string,
  ): Promise<Record<keyof ITokensDto, string | null>>;
  signIn(params: ISignInRequest): Promise<void>;
  auth({ code }: AuthenticatePayload): Promise<void>;
  signUp(params: TSignUpRequest): Promise<void>;
  restore(tokens?: ITokensDto): Promise<void>;
  clear(): void;
}
