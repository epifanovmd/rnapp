import { ApiError, IApiService } from "@api";
import {
  ISignInRequest,
  ITokensDto,
  IUserWithTokensDto,
  TSignUpRequest,
} from "@api/api-gen/data-contracts";
import { ApiResponse, DataHolder } from "@force-dev/utils";
import { ITokenService } from "@service";
import { makeAutoObservable } from "mobx";

import { IUserDataStore } from "../user";
import { ISessionDataStore } from "./SessionData.types";

@ISessionDataStore({ inSingleton: true })
export class SessionDataStore implements ISessionDataStore {
  private holder = new DataHolder<string | null>(null);

  constructor(
    @IUserDataStore() private _userDataStore: IUserDataStore,
    @IApiService() private _apiService: IApiService,
    @ITokenService() private _tokenService: ITokenService,
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

  public async signUp(params: TSignUpRequest) {
    this.holder.setLoading();

    const res = await this._apiService.signUp(params);

    this._handleResponse(res);
  }

  public async updateToken(
    refreshToken: string | null = this._tokenService.refreshToken,
  ) {
    if (refreshToken) {
      const res = await this._apiService.refresh({ refreshToken });

      if (res.error) {
        this.clear();
      } else if (res.data) {
        this._tokenService.setTokens(
          res.data.accessToken,
          res.data.refreshToken,
        );

        this.holder.setData(this._tokenService.accessToken);
      }
    } else {
      this.clear();
    }

    return {
      accessToken: this._tokenService.accessToken,
      refreshToken: this._tokenService.refreshToken,
    };
  }

  async restore(tokens?: ITokensDto) {
    this.holder.setLoading();

    if (tokens) {
      this._tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      this.holder.setData(tokens.accessToken);
      await this._userDataStore.getUser();

      return;
    } else {
      const refreshToken = await this._tokenService.restoreRefreshToken();

      if (refreshToken) {
        const { accessToken } = await this.updateToken(refreshToken);

        if (accessToken) {
          await this._userDataStore.getUser();

          return;
        }
      }
    }
    this.holder.setPending();
  }

  public clear() {
    this.holder.clear();
    this._tokenService.clear();
    this._userDataStore.holder.clear();
  }

  private _handleResponse(res: ApiResponse<IUserWithTokensDto, ApiError>) {
    console.log("res", res);
    if (res.error) {
      this._tokenService.clear();
      this.holder.setError(res.error.message);
    } else if (res.data) {
      const { tokens, ...user } = res.data;

      this._userDataStore.holder.setData(user);
      this._tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      this.holder.setData(this._tokenService.accessToken);
    }
  }
}
