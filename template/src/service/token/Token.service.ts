import AsyncStorage from "@react-native-async-storage/async-storage";
import { action, makeAutoObservable, observable } from "mobx";

import { ITokenService } from "./Token.types";

@ITokenService({ inSingleton: true })
export class TokenService implements ITokenService {
  public accessToken: string | null = null;
  public refreshToken: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    AsyncStorage.setItem("refresh_token", refreshToken).then();
  }

  async restoreRefreshToken() {
    return AsyncStorage.getItem("refresh_token").then(res => res ?? "");
  }

  clear() {
    this.accessToken = null;
    this.refreshToken = null;

    AsyncStorage.removeItem("refresh_token").then();
  }
}
