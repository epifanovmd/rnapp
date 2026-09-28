import { IHolderError, PagedFetchFn } from "../holder.types";
import { useHolderRef } from "../hooks/use-holder-ref";
import { useWatchEffect, WatchOptions } from "../hooks/watch-effect";
import { IPagedHolderPagination, PagedHolder } from "./paged-holder";

export interface UsePagedOptions<TItem, TArgs = void> {
  queryFn?: PagedFetchFn<TItem, TArgs>;

  pageSize?: number;

  keyExtractor?: (item: TItem) => string | number;

  watch?: TArgs extends void ? never : [TArgs];

  enabled?: boolean;

  onFetch?: PagedFetchFn<TItem, TArgs>;
}

type PagedReactive<TItem, TArgs, TError extends IHolderError> = Pick<
  PagedHolder<TItem, TArgs, TError>,
  | "isLoading"
  | "isRefreshing"
  | "isBusy"
  | "isSuccess"
  | "isError"
  | "isIdle"
  | "error"
  | "items"
  | "isEmpty"
  | "pagination"
  | "pageCount"
  | "hasNextPage"
  | "hasPrevPage"
>;

type PagedMethods<TItem, TArgs, TError extends IHolderError> = Pick<
  PagedHolder<TItem, TArgs, TError>,
  | "load"
  | "reload"
  | "goToPage"
  | "nextPage"
  | "prevPage"
  | "setPage"
  | "setPageSize"
  | "prependItem"
  | "appendItem"
  | "removeItem"
  | "updateItem"
  | "reset"
>;

export interface UsePagedResult<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>
  extends
    PagedReactive<TItem, TArgs, TError>,
    PagedMethods<TItem, TArgs, TError> {
  holder: PagedHolder<TItem, TArgs, TError>;
}

export const usePaged = <
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(
  options?: UsePagedOptions<TItem, TArgs>,
): UsePagedResult<TItem, TArgs, TError> => {
  const holder = useHolderRef(() => {
    const fetchFn = (options?.queryFn ?? options?.onFetch) as
      PagedFetchFn<TItem, TArgs> | undefined;

    return new PagedHolder<TItem, TArgs, TError>({
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
    get pagination() {
      return holder.pagination;
    },
    get pageCount() {
      return holder.pageCount;
    },
    get hasNextPage() {
      return holder.hasNextPage;
    },
    get hasPrevPage() {
      return holder.hasPrevPage;
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
    get isSuccess() {
      return holder.isSuccess;
    },
    get isError() {
      return holder.isError;
    },
    get isIdle() {
      return holder.isIdle;
    },
    get isEmpty() {
      return holder.isEmpty;
    },
    get error() {
      return holder.error as TError | null;
    },

    load: holder.load.bind(holder),
    reload: holder.reload.bind(holder),
    goToPage: holder.goToPage.bind(holder),
    nextPage: holder.nextPage.bind(holder),
    prevPage: holder.prevPage.bind(holder),
    setPage: holder.setPage.bind(holder),
    setPageSize: holder.setPageSize.bind(holder),
    prependItem: holder.prependItem.bind(holder),
    appendItem: holder.appendItem.bind(holder),
    removeItem: holder.removeItem.bind(holder),
    updateItem: holder.updateItem.bind(holder),
    reset: holder.reset.bind(holder),

    holder,
  };
};

export const usePagedHolder = usePaged;
