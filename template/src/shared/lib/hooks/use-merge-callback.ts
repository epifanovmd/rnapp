import { useEvent } from "./use-latest-ref";

type CallbackFunction<Args extends unknown[]> = (...args: Args) => void;

/** Один стабильный колбэк, вызывающий все переданные по очереди. */
export const useMergedCallback = <Args extends unknown[]>(
  ...callbacks: (CallbackFunction<Args> | undefined)[]
): CallbackFunction<Args> =>
  useEvent((...args: Args) => {
    callbacks.forEach(callback => callback?.(...args));
  });
