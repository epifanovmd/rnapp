import { BASE_URL } from "@shared/config/env";
import axios from "axios";
import { injectable } from "inversify";

import {
  IAuthSessionService,
  IAuthTokenStorage,
  RefreshResponse,
} from "./types";

const REFRESH_PATH = "/api/auth/refresh";

@injectable()
export class AuthSessionService implements IAuthSessionService {
  private _refreshPromise: Promise<void> | null = null;
  private _sessionExpiredListeners = new Set<() => void>();

  private readonly _axios = axios.create({
    baseURL: BASE_URL,
    timeout: 10_000,
    withCredentials: true,
  });

  constructor(@IAuthTokenStorage() private _tokenStorage: IAuthTokenStorage) {}

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

    try {
      const { data } = await this._axios.post<RefreshResponse>(REFRESH_PATH, {
        refreshToken,
      });

      this._tokenStorage.setTokens(data.accessToken, data.refreshToken);
    } catch (error) {
      this._tokenStorage.clear();
      this._sessionExpiredListeners.forEach(l => l());
      throw error;
    }
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
