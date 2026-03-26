import { createServiceDecorator } from "@di";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { makeAutoObservable } from "mobx";

const REFRESH_TOKEN_KEY = "app:refresh_token";

export const IAuthTokenStore = createServiceDecorator<IAuthTokenStore>();

export interface IAuthTokenStore {
  accessToken: string;
  refreshToken: string;

  isTokenExpiringSoon(bufferSeconds?: number): boolean;
  setTokens(accessToken: string, refreshToken: string): void;
  restoreRefreshToken(): Promise<string | null>;
  clear(): void;
}

@IAuthTokenStore({ inSingleton: true })
export class AuthTokenStore implements IAuthTokenStore {
  public accessToken = "";
  public refreshToken = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  isTokenExpiringSoon(bufferSeconds = 60): boolean {
    if (!this.accessToken) return true;
    try {
      const parts = this.accessToken.split(".");

      if (parts.length !== 3) return true;

      // Base64url decode for React Native
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(
        decodeURIComponent(
          Array.from(atob(base64))
            .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join(""),
        ),
      );

      return Date.now() / 1000 > payload.exp - bufferSeconds;
    } catch {
      return true;
    }
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (refreshToken) {
      AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken).catch(() => {});
    } else {
      AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
    }
  }

  async restoreRefreshToken(): Promise<string | null> {
    const token = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

    if (token) {
      this.refreshToken = token;
    }

    return token;
  }

  clear(): void {
    this.accessToken = "";
    this.refreshToken = "";
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY).catch(() => {});
  }
}
