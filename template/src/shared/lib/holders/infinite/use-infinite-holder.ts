import { IHolderError, InfiniteFetchFn } from "../holder.types";
import { useHolderRef } from "../hooks/use-holder-ref";
import { useWatchEffect, WatchOptions } from "../hooks/watch-effect";
import { InfiniteHolder } from "./infinite-holder";

export interface UseInfiniteOptions<TItem, TArgs = void> {
  queryFn?: InfiniteFetchFn<TItem, TArgs>;

  pageSize?: number;

  keyExtractor?: (item: TItem) => string | number;

  watch?: TArgs extends void ? never : [TArgs];

  enabled?: boolean;

  onFetch?: InfiniteFetchFn<TItem, TArgs>;
}

type InfiniteReactive<TItem, TArgs, TError extends IHolderError> = Pick<
  InfiniteHolder<TItem, TArgs, TError>,
  | "isLoading"
  | "isRefreshing"
  | "isBusy"
  | "isSuccess"
  | "isError"
  | "isIdle"
  | "error"
  | "items"
  | "isLoadingMore"
  | "isLoadMoreError"
  | "hasMore"
  | "loadMoreError"
>;

type InfiniteMethods<TItem, TArgs, TError extends IHolderError> = Pick<
  InfiniteHolder<TItem, TArgs, TError>,
  "load" | "refresh" | "loadMore" | "reset"
>;

export interface UseInfiniteResult<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>
  extends
    InfiniteReactive<TItem, TArgs, TError>,
    InfiniteMethods<TItem, TArgs, TError> {
  holder: InfiniteHolder<TItem, TArgs, TError>;
}

export const useInfinite = <
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(
  options?: UseInfiniteOptions<TItem, TArgs>,
): UseInfiniteResult<TItem, TArgs, TError> => {
  const holder = useHolderRef(() => {
    const fetchFn = (options?.queryFn ?? options?.onFetch) as
      InfiniteFetchFn<TItem, TArgs> | undefined;

    return new InfiniteHolder<TItem, TArgs, TError>({
      onFetch: fetchFn,
      pageSize: options?.pageSize,
      keyExtractor: options?.keyExtractor,
    });
  });

  useWatchEffect(holder.load.bind(holder) as (...args: any[]) => unknown, {
    watch: options?.watch as WatchOptions<TArgs>["watch"],
    enabled: options?.enabled,
  });

  return {
    get items() {
      return holder.items;
    },
    get isLoading() {
      return holder.isLoading;
    },
    get isRefreshing() {
      return holder.isRefreshing;
    },
    get isBusy() {
      return holder.isBusy;
    },
    get isLoadingMore() {
      return holder.isLoadingMore;
    },
    get isLoadMoreError() {
      return holder.isLoadMoreError;
    },
    get hasMore() {
      return holder.hasMore;
    },
    get isSuccess() {
      return holder.isSuccess;
    },
    get isError() {
      return holder.isError;
    },
    get isIdle() {
      return holder.isIdle;
    },
    get error() {
      return holder.error as TError | null;
    },
    get loadMoreError() {
      return holder.loadMoreError as TError | null;
    },

    load: holder.load.bind(holder),
    refresh: holder.refresh.bind(holder),
    loadMore: holder.loadMore.bind(holder) as InfiniteHolder<
      TItem,
      TArgs,
      TError
    >["loadMore"],
    reset: holder.reset.bind(holder),

    holder,
  };
};

export const useInfiniteHolder = useInfinite;
