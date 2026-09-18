import { injectable } from "inversify";

import { IAuthSessionApi } from "./session-api";
import { IAuthSessionService, IAuthTokenStorage } from "./types";

@injectable()
export class AuthSessionService implements IAuthSessionService {
  private _refreshPromise: Promise<void> | null = null;
  private _sessionExpiredListeners = new Set<() => void>();

  constructor(
    @IAuthTokenStorage() private _tokenStorage: IAuthTokenStorage,
    @IAuthSessionApi() private _api: IAuthSessionApi,
  ) {}

  get accessToken(): string {
    return this._tokenStorage.accessToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this._tokenStorage.setTokens(accessToken, refreshToken);
  }

  clearTokens(): void {
    this._tokenStorage.clear();
  }

  async restoreSession(): Promise<boolean> {
    const token = this._tokenStorage.restoreRefreshToken();

    if (!token) return false;

    try {
      await this._forceRefresh();
    } catch {
      return false;
    }

    return !!this._tokenStorage.accessToken;
  }

  async ensureFreshToken(): Promise<void> {
    if (!this._tokenStorage.refreshToken) return;
    if (!this._tokenStorage.isTokenExpiringSoon()) return;

    return this._forceRefresh();
  }

  refreshToken(): Promise<void> {
    return this._forceRefresh();
  }

  onSessionExpired(listener: () => void): () => void {
    this._sessionExpiredListeners.add(listener);

    return () => this._sessionExpiredListeners.delete(listener);
  }

  private async _doRefresh(): Promise<void> {
    const refreshToken = this._tokenStorage.refreshToken;

    if (!refreshToken) {
      this._tokenStorage.clear();
      throw new Error("No refresh token available");
    }

    const { data, error } = await this._api.refresh(refreshToken);

    if (error) {
      this._tokenStorage.clear();
      this._sessionExpiredListeners.forEach(l => l());
      throw error;
    }

    this._tokenStorage.setTokens(data.accessToken, data.refreshToken);
  }

  private _forceRefresh(): Promise<void> {
    if (!this._refreshPromise) {
      this._refreshPromise = this._doRefresh().finally(() => {
        this._refreshPromise = null;
      });
    }

    return this._refreshPromise;
  }
}
