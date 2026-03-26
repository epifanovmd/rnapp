// ---------------------------------------------------------------------------
// Holder Types
// ---------------------------------------------------------------------------

/**
 * Lifecycle status of any holder.
 *
 * idle       - no request has been made yet (initial state after reset)
 * loading    - primary/full load in progress (skeleton, spinner)
 * refreshing - silent background update (old data stays visible)
 * success    - last request completed successfully
 * error      - last request completed with an error
 */
export enum HolderStatus {
  Idle = "idle",
  Loading = "loading",
  Refreshing = "refreshing",
  Success = "success",
  Error = "error",
}

/** Mutation statuses - subset without "refreshing". */
export enum MutationStatus {
  Idle = "idle",
  Loading = "loading",
  Success = "success",
  Error = "error",
}

// --- Cancellable promise ---------------------------------------------------

/**
 * Promise with an optional cancel() method.
 * Used in holders to cancel previous requests on race conditions.
 */
export type CancellablePromise = Promise<unknown> & { cancel?: () => void };

// --- Error -----------------------------------------------------------------

/** Normalized error stored inside every holder. */
export interface IHolderError {
  message: string;
  status?: number;
  code?: string | number;
  details?: unknown;
}

/**
 * Checks whether a response is the result of a cancelled axios request.
 * ApiService resolves (not throws) cancelled requests with `isCanceled: true`.
 * Used by holders to avoid overwriting state on race conditions.
 */
export function isCancelResponse(res: unknown): boolean {
  return (
    typeof res === "object" &&
    res !== null &&
    "isCanceled" in res &&
    (res as { isCanceled: unknown }).isCanceled === true
  );
}

/**
 * Checks whether a thrown value is an axios cancel error.
 * Fallback in case the promise rejects instead of resolving.
 */
export function isCancelError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "__CANCEL__" in e &&
    (e as { __CANCEL__: unknown }).__CANCEL__ === true
  );
}

/**
 * Converts any thrown value or string into `IHolderError`.
 * Used inside the `fromApi` method of every holder.
 */
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

// --- API response contract -------------------------------------------------

/**
 * Shape that every API call must return for holders to process it.
 */
export interface IApiResponse<
  TData = unknown,
  TError extends IHolderError = IHolderError,
> {
  data?: TData | null;
  error?: TError | null;
}

// --- Pagination params -----------------------------------------------------

/** Offset parameters sent to the server. */
export interface IOffsetParams {
  offset: number;
  limit: number;
}

/** Page-based parameters (internally converted to offset). */
export interface IPageParams {
  page: number; // 1-based
  pageSize: number;
}

/** Shape of a paged API endpoint response. */
export interface IPagedResponse<TItem> {
  data: TItem[];
  /** Items on the current page */
  count?: number;
  /** Total items across all pages */
  totalCount?: number;
  offset?: number;
  limit?: number;
}

// --- Fetch function signatures ---------------------------------------------

/** `onFetch` for EntityHolder - returns a single entity or null. */
export type EntityFetchFn<TData, TArgs = void> = (
  args: TArgs,
) => Promise<IApiResponse<TData>>;

/** `onFetch` for CollectionHolder - returns an array of items. */
export type CollectionFetchFn<TItem, TArgs = void> = (
  args: TArgs,
) => Promise<IApiResponse<TItem[]>>;

/**
 * `onFetch` for PagedHolder - receives pagination params + user arguments.
 * Must return current page items and total count from the server.
 */
export type PagedFetchFn<TItem, TArgs = void> = (
  pagination: IOffsetParams,
  args: TArgs,
) => Promise<IApiResponse<IPagedResponse<TItem>>>;

/**
 * `onFetch` for InfiniteHolder - receives offset/limit + user arguments.
 * Must return the next slice of items and a flag indicating more pages.
 */
export type InfiniteFetchFn<TItem, TArgs = void> = (
  pagination: IOffsetParams,
  args: TArgs,
) => Promise<IApiResponse<IPagedResponse<TItem>>>;

/** Mutation function for MutationHolder. */
export type MutationFn<TArgs, TData> = (
  args: TArgs,
) => Promise<IApiResponse<TData>>;
