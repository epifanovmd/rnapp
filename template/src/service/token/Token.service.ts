import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable, reaction } from "mobx";

import { IApiService } from "../../api";
import { ITokenService } from "./Token.types";

@ITokenService({ inSingleton: true })
export class TokenService implements ITokenService {
  public token: string = "";
  public refreshToken: string = "";

  constructor(@IApiService() private _apiService: IApiService) {
    this.restoreRefreshToken().then();

    makeAutoObservable(this, {}, { autoBind: true });

    reaction(() => this.token, _apiService.setToken, { fireImmediately: true });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.token = accessToken;

    if (refreshToken) {
      AsyncStorage.setItem("refresh_token", refreshToken).then();
    } else {
      this.clear();
    }
    this.refreshToken = refreshToken;
  }

  async restoreRefreshToken() {
    const token = await AsyncStorage.getItem("refresh_token").then(
      res => res ?? "",
    );

    this.setTokens(this.token, token);

    return token;
  }

  clear() {
    this.token = "";

    AsyncStorage.removeItem("refresh_token").then();
    this.refreshToken = "";
  }
}
