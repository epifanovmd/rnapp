import { iocHook } from "@force-dev/react-mobile";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, reaction } from "mobx";

import { IApiService } from "../../api";
import { ITokenService } from "./Token.types";

export const useTokenService = iocHook(ITokenService);

@ITokenService({ inSingleton: true })
export class TokenService implements ITokenService {
  accessToken: string = "";
  refreshToken: string = "";

  constructor(@IApiService() private _apiService: IApiService) {
    this.getRefreshToken().then();

    makeAutoObservable(this, {}, { autoBind: true });

    reaction(() => this.accessToken, _apiService.setToken, {
      fireImmediately: true,
    });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;

    AsyncStorage.setItem("refresh_token", refreshToken).then();
    this.refreshToken = refreshToken;
  }

  getRefreshToken() {
    return AsyncStorage.getItem("refresh_token").then(async refreshToken => {
      const token = refreshToken ?? "";

      this.setTokens(this.accessToken, token);

      return token;
    });
  }

  clear() {
    this.accessToken = "";

    AsyncStorage.removeItem("refresh_token").then();
    this.refreshToken = "";
  }
}
