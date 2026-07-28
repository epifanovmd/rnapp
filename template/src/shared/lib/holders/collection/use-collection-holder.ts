import { CollectionFetchFn, IHolderError } from "../holder.types";
import { useHolderRef } from "../hooks/use-holder-ref";
import { useWatchEffect, WatchOptions } from "../hooks/watch-effect";
import { CollectionHolder } from "./collection-holder";

export interface UseCollectionOptions<TItem, TArgs = void> {
  queryFn?: CollectionFetchFn<TItem, TArgs>;

  keyExtractor?: (item: TItem) => string | number;

  watch?: TArgs extends void ? never : [TArgs];

  enabled?: boolean;

  onFetch?: CollectionFetchFn<TItem, TArgs>;
}

type CollectionReactive<TItem, TArgs, TError extends IHolderError> = Pick<
  CollectionHolder<TItem, TArgs, TError>,
  | "isLoading"
  | "isRefreshing"
  | "isBusy"
  | "isSuccess"
  | "isError"
  | "isIdle"
  | "error"
  | "items"
  | "isEmpty"
  | "count"
>;

type CollectionMethods<TItem, TArgs, TError extends IHolderError> = Pick<
  CollectionHolder<TItem, TArgs, TError>,
  | "load"
  | "refresh"
  | "fromApi"
  | "setItems"
  | "prependItem"
  | "appendItem"
  | "removeItem"
  | "updateItem"
  | "upsertItem"
  | "reset"
>;

export interface UseCollectionResult<
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>
  extends
    CollectionReactive<TItem, TArgs, TError>,
    CollectionMethods<TItem, TArgs, TError> {
  holder: CollectionHolder<TItem, TArgs, TError>;
}

export const useCollection = <
  TItem,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(
  options?: UseCollectionOptions<TItem, TArgs>,
): UseCollectionResult<TItem, TArgs, TError> => {
  const holder = useHolderRef(() => {
    const fetchFn = (options?.queryFn ?? options?.onFetch) as
      CollectionFetchFn<TItem, TArgs> | undefined;

    return new CollectionHolder<TItem, TArgs, TError>({
      onFetch: fetchFn,
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
    get count() {
      return holder.count;
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
    refresh: holder.refresh.bind(holder),
    fromApi: holder.fromApi.bind(holder) as CollectionHolder<
      TItem,
      TArgs,
      TError
    >["fromApi"],
    setItems: holder.setItems.bind(holder),
    prependItem: holder.prependItem.bind(holder),
    appendItem: holder.appendItem.bind(holder),
    removeItem: holder.removeItem.bind(holder),
    updateItem: holder.updateItem.bind(holder),
    upsertItem: holder.upsertItem.bind(holder),
    reset: holder.reset.bind(holder),

    holder,
  };
};

export const useCollectionHolder = useCollection;
