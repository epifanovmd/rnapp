import { EntityFetchFn, IHolderError } from "../holder.types";
import { useHolderRef } from "../hooks/use-holder-ref";
import { useWatchEffect, WatchOptions } from "../hooks/watch-effect";
import { EntityHolder } from "./entity-holder";

export interface UseEntityOptions<TData, TArgs = void> {
  queryFn?: EntityFetchFn<TData, TArgs>;

  initialData?: TData;

  watch?: TArgs extends void ? never : [TArgs];

  enabled?: boolean;

  onFetch?: EntityFetchFn<TData, TArgs>;
}

type EntityReactive<TData, TArgs, TError extends IHolderError> = Pick<
  EntityHolder<TData, TArgs, TError>,
  | "data"
  | "isLoading"
  | "isRefreshing"
  | "isBusy"
  | "isSuccess"
  | "isError"
  | "isIdle"
  | "isEmpty"
  | "isFilled"
  | "isReady"
  | "error"
>;

type EntityMethods<TData, TArgs, TError extends IHolderError> = Pick<
  EntityHolder<TData, TArgs, TError>,
  "load" | "refresh" | "fromApi" | "setData" | "reset"
>;

export interface UseEntityResult<
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>
  extends
    EntityReactive<TData, TArgs, TError>,
    EntityMethods<TData, TArgs, TError> {
  holder: EntityHolder<TData, TArgs, TError>;
}

export const useEntity = <
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(
  options?: UseEntityOptions<TData, TArgs>,
): UseEntityResult<TData, TArgs, TError> => {
  const holder = useHolderRef(() => {
    const fetchFn = (options?.queryFn ?? options?.onFetch) as
      EntityFetchFn<TData, TArgs> | undefined;

    return new EntityHolder<TData, TArgs, TError>({
      onFetch: fetchFn,
      initialData: options?.initialData,
    });
  });

  useWatchEffect(holder.load.bind(holder) as (...args: any[]) => unknown, {
    watch: options?.watch as WatchOptions<TArgs>["watch"],
    enabled: options?.enabled,
  });

  return {
    get data() {
      return holder.data;
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
    get isFilled() {
      return holder.isFilled;
    },
    get isReady() {
      return holder.isReady;
    },
    get error() {
      return holder.error;
    },

    load: holder.load.bind(holder),
    refresh: holder.refresh.bind(holder),
    fromApi: holder.fromApi.bind(holder) as EntityHolder<
      TData,
      TArgs,
      TError
    >["fromApi"],
    setData: holder.setData.bind(holder),
    reset: holder.reset.bind(holder),

    holder,
  };
};

export const useEntityHolder = useEntity;
