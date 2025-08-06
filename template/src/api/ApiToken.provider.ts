import { createServiceDecorator } from "@force-dev/utils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable } from "mobx";

export const IApiTokenProvider = createServiceDecorator<IApiTokenProvider>();

export interface IApiTokenProvider {
  accessToken: string;
  refreshToken: string;

  setTokens(accessToken: string, refreshToken: string): void;
  restoreRefreshToken(): Promise<string>;
  clear(): void;
}

@IApiTokenProvider({ inSingleton: true })
export class ApiTokenProvider implements IApiTokenProvider {
  public accessToken: string = "";
  public refreshToken: string = "";

  constructor() {
    this.restoreRefreshToken().then();

    makeAutoObservable(this, {}, { autoBind: true });
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    AsyncStorage.setItem("refresh_token", refreshToken).then();
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
    this.refreshToken = "";

    AsyncStorage.removeItem("refresh_token").then();
  }
}
