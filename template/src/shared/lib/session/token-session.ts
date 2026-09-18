import { refreshNever } from "./refresh-policy";
import {
  EMPTY_TOKENS,
  ITokenSession,
  ITokenStorage,
  RefreshPolicy,
  TokenPair,
  TokenSessionConfig,
  toTokenPair,
} from "./session.types";
import { MemoryTokenStorage } from "./storage/memory-token-storage";

/**
 * Хранение и обновление пары токенов. Специфика бэкенда приходит конфигом:
 * чем обновлять, где хранить и когда обновлять заранее.
 *
 * Параллельные запросы делят одно обновление. Неудачное очищает сессию и
 * поднимает `onSessionExpired`, на который подписан доменный стор.
 */
export class TokenSession implements ITokenSession {
  private _tokens: TokenPair = EMPTY_TOKENS;
  private _refreshing: Promise<void> | null = null;

  private readonly _storage: ITokenStorage;
  private readonly _shouldRefresh: RefreshPolicy;
  private readonly _tokenListeners = new Set<(accessToken: string) => void>();
  private readonly _expiredListeners = new Set<() => void>();
  private readonly _unsubscribeStorage: (() => void) | undefined;

  constructor(private readonly _config: TokenSessionConfig) {
    this._storage = _config.storage ?? new MemoryTokenStorage();
    this._shouldRefresh = _config.shouldRefresh ?? refreshNever;
    this._tokens = this._readStored();
    this._unsubscribeStorage = this._storage.subscribe?.(tokens =>
      this._adoptExternal(tokens),
    );
  }

  get accessToken(): string {
    return this._tokens.accessToken;
  }

  get tokens(): TokenPair {
    return this._tokens;
  }

  get isAuthorized(): boolean {
    return !!this._tokens.accessToken;
  }

  setTokens(tokens: TokenPair): void {
    const pair = toTokenPair(tokens);

    this._storage.write(pair);
    this._applyTokens(pair);
  }

  clear(): void {
    this._storage.clear();
    this._applyTokens(EMPTY_TOKENS);
  }

  async restoreSession(): Promise<boolean> {
    this._applyTokens(this._readStored());

    if (!this._tokens.refreshToken) return false;

    try {
      await this._forceRefresh();
    } catch {
      return false;
    }

    return this.isAuthorized;
  }

  ensureFreshToken(): Promise<void> {
    if (!this._tokens.refreshToken) return Promise.resolve();
    if (!this._shouldRefresh(this._tokens)) return Promise.resolve();

    return this._forceRefresh();
  }

  refreshToken(): Promise<void> {
    return this._forceRefresh();
  }

  onTokenChange(listener: (accessToken: string) => void): () => void {
    this._tokenListeners.add(listener);
    listener(this._tokens.accessToken);

    return () => {
      this._tokenListeners.delete(listener);
    };
  }

  onSessionExpired(listener: () => void): () => void {
    this._expiredListeners.add(listener);

    return () => {
      this._expiredListeners.delete(listener);
    };
  }

  dispose(): void {
    this._unsubscribeStorage?.();
  }

  /**
   * Токены изменились снаружи. Обратно не пишем, а их пропажу считаем концом
   * сессии — так выход в одной вкладке доходит до остальных.
   */
  private _adoptExternal(tokens: TokenPair | null): void {
    const next = tokens ? toTokenPair(tokens) : EMPTY_TOKENS;
    const had = this._hasSession(this._tokens);

    this._applyTokens(next);

    if (had && !this._hasSession(next)) this._notifyExpired();
  }

  private _hasSession(tokens: TokenPair): boolean {
    return !!(tokens.accessToken || tokens.refreshToken);
  }

  private _notifyExpired(): void {
    this._expiredListeners.forEach(listener => listener());
  }

  private _readStored(): TokenPair {
    const stored = this._storage.read();

    return stored ? toTokenPair(stored) : EMPTY_TOKENS;
  }

  private _applyTokens(tokens: TokenPair): void {
    const changed = tokens.accessToken !== this._tokens.accessToken;

    this._tokens = tokens;

    if (changed) {
      this._tokenListeners.forEach(listener => listener(tokens.accessToken));
    }
  }

  private _forceRefresh(): Promise<void> {
    if (!this._refreshing) {
      this._refreshing = this._doRefresh().finally(() => {
        this._refreshing = null;
      });
    }

    return this._refreshing;
  }

  private async _doRefresh(): Promise<void> {
    const refreshToken = this._tokens.refreshToken;

    // Обновлять нечем: это не конец сессии, а её отсутствие.
    if (!refreshToken) {
      this.clear();
      throw new Error("No refresh token available");
    }

    try {
      this.setTokens(await this._config.refresh(refreshToken));
    } catch (error) {
      this.clear();
      this._notifyExpired();
      throw error;
    }
  }
}
