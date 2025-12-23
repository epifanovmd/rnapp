import { ApiError, IApiService, IApiTokenProvider } from "@api";
import {
  AuthenticatePayload,
  ISignInRequest,
  ITokensDto,
  IUserWithTokensDto,
  TSignUpRequest,
} from "@api/api-gen/data-contracts";
import { ApiResponse, DataHolder } from "@force-dev/utils";
import { makeAutoObservable } from "mobx";

import { IUserDataStore } from "../user";
import { ISessionDataStore } from "./SessionData.types";

@ISessionDataStore({ inSingleton: true })
export class SessionDataStore implements ISessionDataStore {
  private holder = new DataHolder<string | null>(null);

  constructor(
    @IUserDataStore() private _userDataStore: IUserDataStore,
    @IApiService() private _apiService: IApiService,
    @IApiTokenProvider() private _tokenProvider: IApiTokenProvider,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    return [];
  }

  get isLoading() {
    return this.holder.isLoading;
  }

  get isAuthorized() {
    return this.holder.isFilled;
  }

  public async signIn(params: ISignInRequest) {
    this.holder.setLoading();

    const res = await this._apiService.signIn(params);

    this._handleResponse(res);
  }

  public async auth(body: AuthenticatePayload) {
    this.holder.setLoading();

    const res = await this._apiService.authenticate(body);

    this._handleResponse(res);
  }

  public async signUp(params: TSignUpRequest) {
    this.holder.setLoading();

    const res = await this._apiService.signUp(params);

    this._handleResponse(res);
  }

  public async updateToken(
    refreshToken: string | null = this._tokenProvider.refreshToken,
  ) {
    if (refreshToken) {
      const res = await this._apiService.refresh({ refreshToken });

      if (res.error) {
        this.clear();
      } else if (res.data) {
        this._tokenProvider.setTokens(
          res.data.accessToken,
          res.data.refreshToken,
        );

        this.holder.setData(this._tokenProvider.accessToken);
      }
    } else {
      this.clear();
    }

    return {
      accessToken: this._tokenProvider.accessToken,
      refreshToken: this._tokenProvider.refreshToken,
    };
  }

  async restore(tokens?: ITokensDto) {
    this.holder.setLoading();

    if (tokens) {
      this._tokenProvider.setTokens(tokens.accessToken, tokens.refreshToken);
      this.holder.setData(tokens.accessToken);
      await this._userDataStore.getUser();

      return;
    } else {
      const refreshToken = await this._tokenProvider.restoreRefreshToken();

      if (refreshToken) {
        await this._apiService.updateToken();

        if (this._tokenProvider.accessToken) {
          await this._userDataStore.getUser();
          this.holder.setData(this._tokenProvider.accessToken);

          return;
        }
      }
    }
    this.holder.setPending();
  }

  public clear() {
    this.holder.clear();
    this._tokenProvider.clear();
    this._userDataStore.holder.clear();
  }

  private _handleResponse(res: ApiResponse<IUserWithTokensDto, ApiError>) {
    if (res.error) {
      this._tokenProvider.clear();
      this.holder.setError(res.error.message);
    } else if (res.data) {
      const { tokens, ...user } = res.data;

      this._userDataStore.holder.setData(user);
      this._tokenProvider.setTokens(tokens.accessToken, tokens.refreshToken);
      this.holder.setData(this._tokenProvider.accessToken);
    }
  }
}
