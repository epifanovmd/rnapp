/**
 * Ответ бэкенда с токенами. Срок и сессия необязательны: без `expiresIn`
 * сессия не обновляет токен заранее и живёт на реакции на 401.
 */
export interface TokenGrant {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Сколько секунд живёт access-токен (как `expires_in` в OAuth 2.0). */
  readonly expiresIn?: number;
  readonly sessionId?: string;
}

/**
 * Состояние токенов. Пустая строка — токена нет. Моменты — `Date.now()`
 * клиента на получении ответа, поэтому расхождение часов с сервером не мешает.
 */
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
  /** Когда access-токен истечёт, мс. */
  readonly expiresAt?: number;
  /** Когда обновить его заранее, мс. */
  readonly refreshAt?: number;
  readonly sessionId?: string;
}

/** Хранение токенов между запусками. Синхронное: сессия нужна до первого запроса. */
export interface ITokenStorage {
  read(): TokenPair | null;
  write(tokens: TokenPair): void;
  clear(): void;
  /** Правки извне, например из другой вкладки. Не всем хранилищам нужен. */
  subscribe?(listener: (tokens: TokenPair | null) => void): () => void;
}

/** Как бэкенд обновляет токены. Реджект означает конец сессии. */
export type RefreshHandler = (refreshToken: string) => Promise<TokenGrant>;

export interface TokenSessionConfig {
  refresh: RefreshHandler;
  /** По умолчанию — только память. */
  storage?: ITokenStorage;
  /** За сколько секунд до истечения обновлять заранее (не больше половины срока). */
  refreshBufferSeconds?: number;
  /** Тихое обновление по таймеру; без срока от бэкенда не работает. */
  autoRefresh?: boolean;
  /**
   * Имя Web Lock: обновление идёт под общей блокировкой вкладок, иначе две
   * вкладки ротировали бы один refresh-токен и одна из них вылетела бы.
   */
  lockName?: string;
  /**
   * Ошибка refresh означает, что сессии больше нет (например, 401). Остальные
   * — временные (нет сети, 5xx): токены сохраняются, обновление повторяется.
   * По умолчанию сессию завершает любая ошибка.
   */
  isSessionRejected?: (error: unknown) => boolean;
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
  /** Сессия бэкенда из последнего ответа с токенами. */
  readonly sessionId: string | undefined;

  /** Обновить заранее, если access-токена нет или срок на исходе. */
  ensureFreshToken(): Promise<void>;
  /** Обновить принудительно (например, после 401). */
  refreshToken(): Promise<void>;

  setTokens(grant: TokenGrant): void;
  clear(): void;
  /** Поднять сессию из хранилища по сохранённому refresh-токену. */
  restoreSession(): Promise<boolean>;
  /** Смена access-токена; вызывается сразу с текущим значением. */
  onTokenChange(listener: (accessToken: string) => void): () => void;
  /** Сессия закончилась: обновление не удалось или её закрыли извне. */
  onSessionExpired(listener: () => void): () => void;
  /** Отписаться от хранилища, таймера и событий окна. */
  dispose(): void;
}

/** Состояние «сессии нет». */
export const EMPTY_TOKENS: TokenPair = { accessToken: "", refreshToken: "" };

/** Запас до истечения по умолчанию. */
export const DEFAULT_REFRESH_BUFFER_SECONDS = 60;

const MS_IN_SECOND = 1000;

/**
 * Ответ бэкенда → состояние токенов. Лишние поля (профиль из ответа логина)
 * отбрасываются. Запас не больше половины срока — иначе короткий токен
 * обновлялся бы сразу после получения.
 */
export const toTokenPair = (
  grant: TokenGrant,
  now: number = Date.now(),
  bufferSeconds: number = DEFAULT_REFRESH_BUFFER_SECONDS,
): TokenPair => {
  const { accessToken, refreshToken, expiresIn, sessionId } = grant;

  if (expiresIn === undefined) {
    return sessionId === undefined
      ? { accessToken, refreshToken }
      : { accessToken, refreshToken, sessionId };
  }

  const lead = Math.min(bufferSeconds, expiresIn / 2);

  return {
    accessToken,
    refreshToken,
    expiresAt: now + expiresIn * MS_IN_SECOND,
    refreshAt: now + (expiresIn - lead) * MS_IN_SECOND,
    ...(sessionId === undefined ? {} : { sessionId }),
  };
};
