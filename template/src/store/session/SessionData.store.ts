import { DataHolder } from "@force-dev/utils";
import { makeAutoObservable, reaction } from "mobx";

import { IRefreshTokenResponse, ITokenService } from "~@service";

import { IProfileDataStore } from "../profile";
import { ISessionDataStore } from "./SessionData.types";

@ISessionDataStore({ inSingleton: true })
export class SessionDataStore implements ISessionDataStore {
  private holder: DataHolder<string> = new DataHolder<string>();

  constructor(
    @IProfileDataStore() private _profileDataStore: IProfileDataStore,
    @ITokenService() private _tokenService: ITokenService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  initialize() {
    return [
      reaction(
        () => this._tokenService.accessToken,
        token => {
          if (!token) {
            this._profileDataStore.holder.clear();
          }
          this.holder.setData(token);
        },
      ),
    ];
  }

  get isAuthorized() {
    return this.holder.isFilled;
  }

  get isReady() {
    return this.holder.isReady;
  }

  async restore(tokens?: IRefreshTokenResponse) {
    if (tokens) {
      this._tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
      await this._profileDataStore.getProfile();

      return tokens.accessToken;
    } else {
      this.holder.setLoading();

      const { accessToken } = await this._profileDataStore.updateToken();

      await this._profileDataStore.getProfile();

      this.holder.setData(accessToken);

      return accessToken;
    }
  }
}
