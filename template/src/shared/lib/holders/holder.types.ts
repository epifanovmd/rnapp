export enum HolderStatus {
  Idle = "idle",
  Loading = "loading",
  Refreshing = "refreshing",
  Success = "success",
  Error = "error",
}

export enum MutationStatus {
  Idle = "idle",
  Loading = "loading",
  Success = "success",
  Error = "error",
}

export type CancellablePromise = Promise<unknown> & { cancel?: () => void };

export interface IHolderError {
  message: string;
  status?: number;
  code?: string | number;
  details?: unknown;
  /** Запрос отменён — не ошибка для UI (см. `ApiError.isCanceled`). */
  isCanceled?: boolean;
}

/** Отменённый ответ: `error` с флагом `isCanceled` (контракт `ApiError`). */
export function isCancelResponse(res: unknown): boolean {
  return (
    typeof res === "object" &&
    res !== null &&
    isCancelError((res as { error?: unknown }).error)
  );
}

export function isCancelError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    (e as { isCanceled?: unknown }).isCanceled === true
  );
}

export function toHolderError(e: unknown): IHolderError {
  if (e instanceof Error) {
    return {
      message: e.message,
      code: (e as { code?: string | number }).code,
    };
  }
  if (typeof e === "string") return { message: e };

  return { message: "Unknown error", details: e };
}

export interface IApiResponse<
  TData = unknown,
  TError extends IHolderError = IHolderError,
> {
  data?: TData | null;
  error?: TError | null;
}

export interface IOffsetParams {
  offset: number;
  limit: number;
}

export interface IPageParams {
  page: number;
  pageSize: number;
}

export interface IPagedResponse<TItem> {
  data: TItem[];
  count?: number;
  totalCount?: number;
  offset?: number;
  limit?: number;
}

export type EntityFetchFn<TData, TArgs = void> = (
  args: TArgs,
) => Promise<IApiResponse<TData>>;

export type CollectionFetchFn<TItem, TArgs = void> = (
  args: TArgs,
) => Promise<IApiResponse<TItem[]>>;

export type PagedFetchFn<TItem, TArgs = void> = (
  pagination: IOffsetParams,
  args: TArgs,
) => Promise<IApiResponse<IPagedResponse<TItem>>>;

export type InfiniteFetchFn<TItem, TArgs = void> = (
  pagination: IOffsetParams,
  args: TArgs,
) => Promise<IApiResponse<IPagedResponse<TItem>>>;

export type MutationFn<TArgs, TData> = (
  args: TArgs,
) => Promise<IApiResponse<TData>>;
