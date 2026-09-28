import { useEffect } from "react";

import { EntityFetchFn, IHolderError } from "../holder.types";
import { useHolderRef } from "../hooks/use-holder-ref";
import { PollingHolder, PollingStartOptions } from "./polling-holder";

export interface UsePollingOptions<TData, TArgs = void> {
  queryFn?: EntityFetchFn<TData, TArgs>;

  interval?: number;

  initialData?: TData;

  autoStart?: TArgs extends void ? true : TArgs;

  onFetch?: EntityFetchFn<TData, TArgs>;
}

type PollingReactive<TData, TArgs, TError extends IHolderError> = Pick<
  PollingHolder<TData, TArgs, TError>,
  | "data"
  | "isLoading"
  | "isBusy"
  | "isPolling"
  | "isSuccess"
  | "isError"
  | "error"
>;

type PollingMethods<TData, TArgs, TError extends IHolderError> = Pick<
  PollingHolder<TData, TArgs, TError>,
  "load" | "refresh" | "reset"
>;

export interface UsePollingResult<
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>
  extends
    PollingReactive<TData, TArgs, TError>,
    PollingMethods<TData, TArgs, TError> {
  start: (options?: PollingStartOptions<TArgs>) => void;
  stop: () => void;

  holder: PollingHolder<TData, TArgs, TError>;
}

export const usePolling = <
  TData,
  TArgs = void,
  TError extends IHolderError = IHolderError,
>(
  options?: UsePollingOptions<TData, TArgs>,
): UsePollingResult<TData, TArgs, TError> => {
  const holder = useHolderRef(() => {
    const fetchFn = (options?.queryFn ?? options?.onFetch) as
      EntityFetchFn<TData, TArgs> | undefined;

    return new PollingHolder<TData, TArgs, TError>({
      onFetch: fetchFn,
      interval: options?.interval,
      initialData: options?.initialData,
    });
  });

  useEffect(() => {
    const { autoStart } = options ?? {};

    if (autoStart === true) {
      holder.startPolling();
    } else if (autoStart !== undefined) {
      holder.startPolling({ args: autoStart } as PollingStartOptions<TArgs>);
    }

    return () => {
      holder.stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    get data() {
      return holder.data;
    },
    get isLoading() {
      return holder.isLoading;
    },
    get isBusy() {
      return holder.isBusy;
    },
    get isPolling() {
      return holder.isPolling;
    },
    get isSuccess() {
      return holder.isSuccess;
    },
    get isError() {
      return holder.isError;
    },
    get error() {
      return holder.error as TError | null;
    },

    start: ((...args: any[]) => (holder.startPolling as any)(...args)) as (
      options?: PollingStartOptions<TArgs>,
    ) => void,
    stop: holder.stopPolling.bind(holder),
    load: holder.load.bind(holder),
    refresh: holder.refresh.bind(holder),
    reset: holder.reset.bind(holder),

    holder,
  };
};

export const usePollingHolder = usePolling;
