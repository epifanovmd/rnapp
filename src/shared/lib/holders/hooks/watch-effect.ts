import { useEffect } from "react";

export interface WatchOptions<TArgs> {
  /** Загружать при монтировании и при смене аргумента. */
  watch?: TArgs extends void ? never : [TArgs];

  /** false — не загружать автоматически (ни по watch, ни по autoLoad). */
  enabled?: boolean;

  /**
   * Загрузить при монтировании без аргументов — для холдеров без `watch`
   * (запрос без параметров). Без него и без `watch` холдер сам не грузит:
   * нужен явный `load()`.
   */
  autoLoad?: boolean;
}

type AnyLoadFn = (...args: any[]) => unknown;

export const useWatchEffect = <TArgs>(
  loadFn: (...args: any[]) => unknown,
  options?: WatchOptions<TArgs>,
): void => {
  const { watch, enabled = true, autoLoad = false } = options ?? {};
  const isWatching = watch !== undefined;
  const watchArg = watch?.[0];

  useEffect(() => {
    if (!enabled) return;
    if (isWatching) (loadFn as AnyLoadFn)(watchArg);
    else if (autoLoad) (loadFn as AnyLoadFn)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWatching, watchArg, enabled, autoLoad]);
};
