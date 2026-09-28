import {
  DEFAULT_REFRESH_BUFFER_SECONDS,
  EMPTY_TOKENS,
  ITokenSession,
  ITokenStorage,
  TokenGrant,
  TokenPair,
  TokenSessionConfig,
  toTokenPair,
} from "./session.types";
import { MemoryTokenStorage } from "./storage/memory-token-storage";

/** Предел `setTimeout` (~24,8 суток): большее значение сработало бы сразу. */
const MAX_TIMER_DELAY = 2 ** 31 - 1;

/** Пауза перед повтором после временной ошибки refresh. */
const TRANSIENT_RETRY_MS = 10_000;

const noop = () => {};

const rejectAll = () => true;

const isPageHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

const hasSession = (tokens: TokenPair) =>
  !!(tokens.accessToken || tokens.refreshToken);

/**
 * Хранение и обновление токенов. Специфика бэкенда приходит конфигом: чем
 * обновлять, где хранить, за сколько до истечения обновлять.
 *
 * - Срок берётся из ответа бэкенда (`expiresIn`), токен не разбирается.
 * - Тихое обновление по таймеру до истечения; в скрытой вкладке таймер
 *   ждёт, при возвращении токен проверяется сразу.
 * - Параллельные вызовы делят одно обновление, вкладки — одну блокировку
 *   (Web Locks): кто дождался её, сперва проверяет, не обновила ли токены
 *   другая вкладка.
 * - Отказ бэкенда (`isSessionRejected`) очищает сессию и поднимает
 *   `onSessionExpired`; временная ошибка оставляет токены и повторяется.
 */
export class TokenSession implements ITokenSession {
  private _tokens: TokenPair = EMPTY_TOKENS;
  private _refreshing: Promise<void> | null = null;
  private _timer: ReturnType<typeof setTimeout> | undefined;

  private readonly _storage: ITokenStorage;
  private readonly _bufferSeconds: number;
  private readonly _autoRefresh: boolean;
  private readonly _tokenListeners = new Set<(accessToken: string) => void>();
  private readonly _expiredListeners = new Set<() => void>();
  private readonly _unsubscribeStorage: (() => void) | undefined;

  constructor(private readonly _config: TokenSessionConfig) {
    this._storage = _config.storage ?? new MemoryTokenStorage();
    this._bufferSeconds =
      _config.refreshBufferSeconds ?? DEFAULT_REFRESH_BUFFER_SECONDS;
    this._autoRefresh = _config.autoRefresh ?? true;
    this._tokens = this._storage.read() ?? EMPTY_TOKENS;
    this._unsubscribeStorage = this._storage.subscribe?.(tokens =>
      this._adoptExternal(tokens),
    );

    if (this._autoRefresh && typeof document !== "undefined") {
      document.addEventListener("visibilitychange", this._onWake);
      window.addEventListener("online", this._onWake);
    }
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

  get sessionId(): string | undefined {
    return this._tokens.sessionId;
  }

  setTokens(grant: TokenGrant): void {
    const tokens = toTokenPair(grant, Date.now(), this._bufferSeconds);

    this._storage.write(tokens);
    this._applyTokens(tokens);
  }

  clear(): void {
    this._storage.clear();
    this._applyTokens(EMPTY_TOKENS);
  }

  async restoreSession(): Promise<boolean> {
    this._applyTokens(this._storage.read() ?? EMPTY_TOKENS);

    if (!this._tokens.refreshToken) return false;

    try {
      await this._forceRefresh();
    } catch {
      return false;
    }

    return this.isAuthorized;
  }

  ensureFreshToken(): Promise<void> {
    if (!this._needsRefresh()) return Promise.resolve();

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
    clearTimeout(this._timer);

    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", this._onWake);
      window.removeEventListener("online", this._onWake);
    }
  }

  /** Access-токена нет или пора обновить заранее. */
  private _needsRefresh(): boolean {
    const { accessToken, refreshToken, refreshAt } = this._tokens;

    if (!refreshToken) return false;
    if (!accessToken) return true;

    return refreshAt !== undefined && Date.now() >= refreshAt;
  }

  /** Вкладку вернули или сеть появилась: таймер мог пропустить свой срок. */
  private readonly _onWake = (): void => {
    if (isPageHidden()) return;

    this.ensureFreshToken().catch(noop);
  };

  private _schedule(): void {
    clearTimeout(this._timer);
    this._timer = undefined;

    const { refreshAt, refreshToken } = this._tokens;

    if (!this._autoRefresh || refreshAt === undefined || !refreshToken) return;

    const delay = Math.min(
      Math.max(0, refreshAt - Date.now()),
      MAX_TIMER_DELAY,
    );

    this._timer = setTimeout(() => {
      // Скрытая вкладка не обновляет: токен ей пришлёт видимая, а сама она
      // проверит срок, когда её откроют.
      if (!isPageHidden()) this.ensureFreshToken().catch(noop);
    }, delay);
  }

  /** Временная ошибка: проверить срок ещё раз чуть позже. */
  private _scheduleRetry(): void {
    if (!this._autoRefresh) return;

    clearTimeout(this._timer);
    this._timer = setTimeout(() => {
      if (!isPageHidden()) this.ensureFreshToken().catch(noop);
    }, TRANSIENT_RETRY_MS);
  }

  /**
   * Токены изменились в другой вкладке. Обратно не пишем, а их пропажу
   * считаем концом сессии — так выход в одной вкладке доходит до остальных.
   */
  private _adoptExternal(tokens: TokenPair | null): void {
    const next = tokens ?? EMPTY_TOKENS;
    const had = hasSession(this._tokens);

    this._applyTokens(next);

    if (had && !hasSession(next)) this._notifyExpired();
  }

  private _notifyExpired(): void {
    this._expiredListeners.forEach(listener => listener());
  }

  private _applyTokens(tokens: TokenPair): void {
    const changed = tokens.accessToken !== this._tokens.accessToken;

    this._tokens = tokens;
    this._schedule();

    if (changed) {
      this._tokenListeners.forEach(listener => listener(tokens.accessToken));
    }
  }

  private _forceRefresh(): Promise<void> {
    if (!this._refreshing) {
      const startedWith = this._tokens.refreshToken;

      this._refreshing = this._withLock(() =>
        this._doRefresh(startedWith),
      ).finally(() => {
        this._refreshing = null;
      });
    }

    return this._refreshing;
  }

  private _withLock(task: () => Promise<void>): Promise<void> {
    const { lockName } = this._config;
    const locks =
      typeof navigator === "undefined" ? undefined : navigator.locks;

    return lockName && locks ? locks.request<void>(lockName, task) : task();
  }

  private async _doRefresh(startedWith: string): Promise<void> {
    // Пока ждали блокировку, другая вкладка обновила токены и прислала их.
    if (
      this._tokens.refreshToken !== startedWith &&
      !this._needsRefresh() &&
      this.isAuthorized
    ) {
      return;
    }

    // Хранилище общее для вкладок: в нём самый свежий refresh-токен.
    const refreshToken =
      this._storage.read()?.refreshToken || this._tokens.refreshToken;

    // Обновлять нечем: это не конец сессии, а её отсутствие.
    if (!refreshToken) {
      this.clear();
      throw new Error("No refresh token available");
    }

    try {
      this.setTokens(await this._config.refresh(refreshToken));
    } catch (error) {
      if ((this._config.isSessionRejected ?? rejectAll)(error)) {
        this.clear();
        this._notifyExpired();
      } else {
        this._scheduleRetry();
      }

      throw error;
    }
  }
}
