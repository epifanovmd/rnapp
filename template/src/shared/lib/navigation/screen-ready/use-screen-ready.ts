import {
  NavigationContext,
  NavigationRouteContext,
  useIsFocused,
} from "@react-navigation/native";
import {
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

import { findStackRouteKey, INavigationLike } from "./find-stack-route-key";
import { screenTransitions } from "./transition-tracker";

export interface IScreenReadyOptions {
  /** Ждать, пока экран станет активным (фокус). По умолчанию `true`. */
  waitForFocus?: boolean;
  /** Ждать конца анимации открытия экрана стека. По умолчанию `true`. */
  waitForTransition?: boolean;
  /** Пауза после выполнения условий, мс. По умолчанию 0. */
  delay?: number;
  /**
   * Страховка, мс: анимация считается завершённой, даже если события не
   * пришло (стек без `screenTransitionListeners`). По умолчанию 1000.
   */
  timeout?: number;
  /** Раз став готовым, экран не возвращается к ожиданию. По умолчанию `true`. */
  once?: boolean;
}

/**
 * Готов ли экран к тяжёлому контенту: он активен и анимация его открытия
 * закончилась. До этого экран рисует скелетон — переход не делит кадры с
 * монтажом графиков, каруселей и длинных списков.
 *
 * Работает и для вложенных экранов (вкладка внутри экрана стека): ждёт
 * открытия ближайшего экрана стека. Стек подключается один раз —
 * `screenListeners: screenTransitionListeners`.
 */
export const useScreenReady = ({
  waitForFocus = true,
  waitForTransition = true,
  delay = 0,
  timeout = 1000,
  once = true,
}: IScreenReadyOptions = {}) => {
  const navigation = useContext(NavigationContext);
  const route = useContext(NavigationRouteContext);
  const focused = useIsFocused();

  const stackRouteKey = useMemo(
    () =>
      navigation && route
        ? findStackRouteKey(navigation as INavigationLike, route.key)
        : null,
    [navigation, route],
  );

  const opened = useSyncExternalStore(screenTransitions.subscribe, () =>
    stackRouteKey === null ? true : screenTransitions.isOpened(stackRouteKey),
  );

  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!waitForTransition || opened || timedOut) return;

    const timer = setTimeout(() => setTimedOut(true), timeout);

    return () => clearTimeout(timer);
  }, [waitForTransition, opened, timedOut, timeout]);

  const conditions =
    (!waitForFocus || focused) && (!waitForTransition || opened || timedOut);

  const [ready, setReady] = useState(() => conditions && delay <= 0);

  useEffect(() => {
    if (!conditions) {
      if (!once) setReady(false);

      return;
    }
    if (delay <= 0) {
      setReady(true);

      return;
    }

    const timer = setTimeout(() => setReady(true), delay);

    return () => clearTimeout(timer);
  }, [conditions, delay, once]);

  return once ? ready : ready && conditions;
};
