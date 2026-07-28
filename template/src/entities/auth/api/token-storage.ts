import { IStorageService } from "@shared/lib/storage";
import { injectable } from "inversify";
import { makeAutoObservable } from "mobx";

import { IAuthJwtService } from "./jwt-types";
import { IAuthTokenStorage } from "./types";

const REFRESH_TOKEN_KEY = "app:refresh_token";

@injectable()
export class AuthTokenStorage implements IAuthTokenStorage {
  public accessToken = "";
  public refreshToken = "";

  constructor(
    @IStorageService() private _storage: IStorageService,
    @IAuthJwtService() private _jwt: IAuthJwtService,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  isTokenExpiringSoon(bufferSeconds = 60): boolean {
    if (!this.accessToken) return true;

    return this._jwt.isExpired(this.accessToken, bufferSeconds);
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (refreshToken) {
      this._storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    } else {
      this._storage.removeItem(REFRESH_TOKEN_KEY);
    }
  }

  restoreRefreshToken(): string | null {
    const token = this._storage.getItem(REFRESH_TOKEN_KEY);

    if (token) {
      this.refreshToken = token;
    }

    return token;
  }

  clear(): void {
    this.accessToken = "";
    this.refreshToken = "";
    this._storage.removeItem(REFRESH_TOKEN_KEY);
  }
}
