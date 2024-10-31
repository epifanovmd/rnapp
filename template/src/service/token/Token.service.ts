import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable } from "mobx";

import { ITokenService } from "./Token.types";

@ITokenService({ inSingleton: true })
export class TokenService implements ITokenService {
  public accessToken: string = "";
  public refreshToken: string = "";

  constructor() {
    this.restoreRefreshToken().then();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;

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

    this.setTokens(this.accessToken, token);

    return token;
  }

  clear() {
    this.accessToken = "";

    AsyncStorage.removeItem("refresh_token").then();
    this.refreshToken = "";
  }
}
