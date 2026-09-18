/** Пара токенов; пустая строка означает отсутствие токена. */
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

/** Хранение токенов между запусками. Синхронное: сессия нужна до первого запроса. */
export interface ITokenStorage {
  read(): TokenPair | null;
  write(tokens: TokenPair): void;
  clear(): void;
  /** Правки извне, например из другой вкладки. Не всем хранилищам нужен. */
  subscribe?(listener: (tokens: TokenPair | null) => void): () => void;
}

/** Как бэкенд обновляет пару токенов. Реджект означает конец сессии. */
export type RefreshHandler = (refreshToken: string) => Promise<TokenPair>;

/** Обновлять ли токен заранее, до отправки запроса. */
export type RefreshPolicy = (tokens: TokenPair) => boolean;

export interface TokenSessionConfig {
  refresh: RefreshHandler;
  /** По умолчанию — только память. */
  storage?: ITokenStorage;
  /** По умолчанию заранее не обновляет: реагирует на 401. */
  shouldRefresh?: RefreshPolicy;
}

/**
 * Сессия бэкенда. `ITokenSource` из `lib/http` не наследуется намеренно: слой
 * не зависит от транспорта, совпадение формы проверяется в точке соединения.
 */
export interface ITokenSession {
  /** Текущий access-токен; пустая строка, если сессии нет. */
  readonly accessToken: string;
  readonly tokens: TokenPair;
  readonly isAuthorized: boolean;

  /** Обновить заранее, если так решит политика. */
  ensureFreshToken(): Promise<void>;
  /** Обновить пару принудительно. */
  refreshToken(): Promise<void>;

  setTokens(tokens: TokenPair): void;
  clear(): void;
  /** Поднять сессию из хранилища по сохранённому refresh-токену. */
  restoreSession(): Promise<boolean>;
  /** Смена access-токена; вызывается сразу с текущим значением. */
  onTokenChange(listener: (accessToken: string) => void): () => void;
  /** Сессия закончилась: обновление не удалось или её закрыли извне. */
  onSessionExpired(listener: () => void): () => void;
  /** Отписаться от хранилища. */
  dispose(): void;
}

/** Состояние «сессии нет». */
export const EMPTY_TOKENS: TokenPair = { accessToken: "", refreshToken: "" };

/** Оставляет только токены: ответ логина несёт ещё и профиль. */
export const toTokenPair = (source: TokenPair): TokenPair => ({
  accessToken: source.accessToken,
  refreshToken: source.refreshToken,
});
