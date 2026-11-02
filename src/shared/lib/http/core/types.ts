import type { ApiError } from "./errors";

export type HttpMethod =
  "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";

export type HttpHeaders = Record<string, string>;

/** Любой объект: у интерфейсов нет индексной сигнатуры и они не подошли бы под `Record`. */
export type HttpQueryParams = object;

export type HttpResponseType = "json" | "text" | "blob" | "arraybuffer";

export interface HttpProgress {
  /** Передано байт. */
  loaded: number;
  /** Всего байт; неизвестно, если сервер не прислал длину. */
  total?: number;
  /** Доля от 0 до 1; есть только при известном размере. */
  ratio?: number;
}

/** Слушатель прогресса. При повторе запроса отсчёт начинается заново. */
export type HttpProgressListener = (progress: HttpProgress) => void;

/** Описание запроса: его строит orval и методы `BaseApi`. */
export interface HttpRequest<TData = unknown> {
  url: string;
  method?: HttpMethod | Lowercase<HttpMethod>;
  /** Перекрывает baseUrl клиента для этого запроса. */
  baseUrl?: string;
  params?: HttpQueryParams;
  data?: TData;
  headers?: HttpHeaders;
  timeout?: number;
  responseType?: HttpResponseType;
  withCredentials?: boolean;
  onUploadProgress?: HttpProgressListener;
  onDownloadProgress?: HttpProgressListener;
}

/**
 * Второй аргумент любого метода API. Middleware добавляют сюда свои флаги
 * через declaration merging: `auth`, `queryRace`, `retry`, `notifyErrors`.
 */
export interface RequestOptions {
  headers?: HttpHeaders;
  params?: HttpQueryParams;
  timeout?: number;
  baseUrl?: string;
  responseType?: HttpResponseType;
  onUploadProgress?: HttpProgressListener;
  onDownloadProgress?: HttpProgressListener;
  /** Внешняя отмена; связывается с контроллером запроса. */
  signal?: AbortSignal;
}

export interface HttpResponse<TData = unknown> {
  status: number;
  statusText?: string;
  headers: HttpHeaders;
  data: TData;
}

/** Состояние одного запроса на всём пути от клиента до транспорта. */
export interface RequestContext<TData = unknown> {
  /** Нормализованный запрос; middleware вправе его менять. */
  request: HttpRequest<TData>;
  readonly options: RequestOptions;
  readonly signal: AbortSignal;
  /** Место для состояния middleware в пределах запроса. */
  readonly state: Record<string, unknown>;
  cancel(reason?: string): void;
}

/** Ответ без исключений. Отмена приходит сюда же, как `error.isCanceled`. */
export type ApiResponse<TData, TError extends ApiError = ApiError> =
  | { readonly data: TData; readonly error?: undefined }
  | { readonly data?: undefined; readonly error: TError };
