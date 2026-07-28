import { useCallback, useRef } from "react";

import { IHolderError, MutationFn } from "../holder.types";
import { IMutationHolderResult, MutationHolder } from "./mutation-holder";

export interface UseMutationOptions<
  TArgs,
  TData,
  TError extends IHolderError = IHolderError,
> {
  mutationFn?: MutationFn<TArgs, TData>;

  onSuccess?: (data: TData) => void;

  onError?: (error: TError) => void;

  onSettled?: () => void;
}

type MutationReactive<TArgs, TData, TError extends IHolderError> = Pick<
  MutationHolder<TArgs, TData, TError>,
  "data" | "isLoading" | "isSuccess" | "isError" | "isIdle" | "error"
> & { isBusy: boolean };

export interface UseMutationResult<
  TArgs,
  TData,
  TError extends IHolderError = IHolderError,
> extends MutationReactive<TArgs, TData, TError> {
  reset: () => void;

  mutate: TArgs extends void
    ? (args?: never) => Promise<TData | undefined>
    : (args: TArgs) => Promise<TData | undefined>;

  mutateAsync: TArgs extends void
    ? (args?: never) => Promise<TData>
    : (args: TArgs) => Promise<TData>;

  holder: MutationHolder<TArgs, TData, TError>;
}

export const useMutation = <
  TArgs = void,
  TData = void,
  TError extends IHolderError = IHolderError,
>(
  options?: UseMutationOptions<TArgs, TData, TError>,
): UseMutationResult<TArgs, TData, TError> => {
  const ref = useRef<MutationHolder<TArgs, TData, TError> | null>(null);
  const callbacksRef = useRef(options);

  callbacksRef.current = options;

  if (!ref.current) {
    ref.current = new MutationHolder<TArgs, TData, TError>({
      onMutate: options?.mutationFn,
    });
  }

  const holder = ref.current;

  const executeWrapper = useCallback(
    async (...params: any[]): Promise<IMutationHolderResult<TData, TError>> => {
      return (
        holder.execute as (
          ...args: any[]
        ) => Promise<IMutationHolderResult<TData, TError>>
      )(...params);
    },
    [holder],
  );

  const mutate = useCallback(
    async (...params: any[]): Promise<TData | undefined> => {
      const result = await executeWrapper(...params);
      const callbacks = callbacksRef.current;

      if (result.data) {
        callbacks?.onSuccess?.(result.data);
      } else if (result.error) {
        callbacks?.onError?.(result.error as TError);
      }
      callbacks?.onSettled?.();

      return result.data ?? undefined;
    },
    [executeWrapper],
  ) as UseMutationResult<TArgs, TData, TError>["mutate"];

  const mutateAsync = useCallback(
    async (...params: any[]): Promise<TData> => {
      const result = await executeWrapper(...params);
      const callbacks = callbacksRef.current;

      if (result.error) {
        callbacks?.onError?.(result.error as TError);
        callbacks?.onSettled?.();
        throw result.error;
      }

      callbacks?.onSuccess?.(result.data!);
      callbacks?.onSettled?.();

      return result.data!;
    },
    [executeWrapper],
  ) as UseMutationResult<TArgs, TData, TError>["mutateAsync"];

  return {
    get data() {
      return holder.data;
    },
    get isLoading() {
      return holder.isLoading;
    },
    get isBusy() {
      return holder.isLoading;
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

    mutate,
    mutateAsync,
    reset: holder.reset.bind(holder),

    holder,
  };
};

export const useMutationHolder = useMutation;
