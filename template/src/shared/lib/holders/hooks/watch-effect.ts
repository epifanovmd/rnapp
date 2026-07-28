import { useEffect } from "react";

export interface WatchOptions<TArgs> {
  watch?: TArgs extends void ? never : [TArgs];

  enabled?: boolean;
}

type AnyLoadFn = (...args: any[]) => unknown;

export const useWatchEffect = <TArgs>(
  loadFn: (...args: any[]) => unknown,
  options?: WatchOptions<TArgs>,
): void => {
  const { watch, enabled = true } = options ?? {};
  const isWatching = watch !== undefined;
  const watchArg = watch?.[0];

  useEffect(() => {
    if (!enabled || !isWatching) return;

    (loadFn as AnyLoadFn)(watchArg);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWatching, watchArg, enabled]);
};
