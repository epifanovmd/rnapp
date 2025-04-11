import { ApiResponse, DataHolder } from "@force-dev/utils";
import {
  IProfileService,
  IRefreshTokenResponse,
  ISignInRequest,
  ISignInResponse,
  ITokenService,
} from "@service";
import { makeAutoObservable } from "mobx";

import { IProfileDataStore } from "../profile";
import { ISessionDataStore } from "./SessionData.types";

@ISessionDataStore({ inSingleton: true })
export class SessionDataStore implements ISessionDataStore {
  private holder = new DataHolder<string | null>(null);

  constructor(
    @IProfileDataStore() private _profileDataStore: IProfileDataStore,
    @IProfileService() private _profileService: IProfileService,
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

    const res = await this._profileService.signIn(params);

    this._handleResponse(res);
  }

  // public async signUp(params: TSignUpRequest) {
  //   this.holder.setLoading();
  //
  //   const res = await this._apiService.signUp(params);
  //
  //   this._handleResponse(res);
  // }

  public async updateToken(
    refreshToken: string | null = this._tokenService.refreshToken,
  ) {
    if (refreshToken) {
      const res = await this._profileService.refresh({ refreshToken });

      if (res.error) {
        this.clear();
      } else if (res.data) {
        this.holder.setData(res.data.accessToken);
        this._tokenService.setTokens(
          res.data.accessToken,
          res.data.refreshToken,
        );
      }
    } else {
      this.clear();
    }

    return {
      accessToken: this._tokenService.accessToken,
      refreshToken: this._tokenService.refreshToken,
    };
  }

  async restore(tokens?: IRefreshTokenResponse) {
    this.holder.setLoading();

    if (tokens) {
      this._tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      await this._profileDataStore.getProfile();
    } else {
      const refreshToken = await this._tokenService.restoreRefreshToken();

      if (refreshToken) {
        const { accessToken } = await this.updateToken(refreshToken);

        if (accessToken) {
          await this._profileDataStore.getProfile();

          return;
        }
      }
    }
    this.holder.setPending();
  }

  public clear() {
    this.holder.clear();
    this._tokenService.clear();
    this._profileDataStore.holder.clear();
  }

  private _handleResponse(res: ApiResponse<ISignInResponse>) {
    if (res.error) {
      this._tokenService.clear();
      this.holder.setError(res.error.message);
    } else if (res.data) {
      const { accessToken, refreshToken, ...profile } = res.data;

      this._profileDataStore.holder.setData(profile);
      this.holder.setData(res.data.accessToken);
      this._tokenService.setTokens(accessToken, refreshToken);
    }
  }
}
