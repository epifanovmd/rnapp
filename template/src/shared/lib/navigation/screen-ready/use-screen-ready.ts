import { NavigationRouteContext } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";

import { screenReadiness } from "./app-screen-readiness";
import { IScreenReadyOptions } from "./screen-readiness";

export interface IUseScreenReadyOptions extends IScreenReadyOptions {
  /** Раз став готовым, экран не возвращается к ожиданию. По умолчанию `true`. */
  once?: boolean;
}

/**
 * Готов ли текущий экран к тяжёлому контенту — React-обёртка над
 * `screenReadiness`. До готовности экран рисует скелетон: переход не делит
 * кадры с монтажом графиков, каруселей и длинных списков.
 */
export const useScreenReady = ({
  once = true,
  waitForFocus,
  waitForTransition,
  delay = 0,
  timeout,
}: IUseScreenReadyOptions = {}) => {
  const routeKey = useContext(NavigationRouteContext)?.key;

  const [ready, setReady] = useState(
    () =>
      !routeKey ||
      (delay <= 0 &&
        screenReadiness.isReady(routeKey, { waitForFocus, waitForTransition })),
  );

  useEffect(() => {
    if (!routeKey) return;

    if (!ready) {
      return screenReadiness.onReady(routeKey, () => setReady(true), {
        waitForFocus,
        waitForTransition,
        delay,
        timeout,
      });
    }
    if (once) return;

    return screenReadiness.subscribe(() => {
      if (
        !screenReadiness.isReady(routeKey, { waitForFocus, waitForTransition })
      ) {
        setReady(false);
      }
    });
  }, [routeKey, ready, once, waitForFocus, waitForTransition, delay, timeout]);

  return ready;
};
