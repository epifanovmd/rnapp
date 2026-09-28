import { useContext } from "react";

import { IScrollTelemetry } from "./scroll.types";
import { ScrollContext } from "./scroll-context";

/**
 * Телеметрия скролла экрана; требует ScrollProvider выше по дереву.
 *
 * Хук только потребляет: если компоненту нужен собственный скролл (он сам
 * вешает scrollHandler и от него же анимирует), телеметрию создаёт
 * useScrollTelemetry — владение остаётся явным.
 */
export const useScroll = (): IScrollTelemetry => {
  const telemetry = useContext(ScrollContext);

  if (!telemetry) {
    throw new Error("useScroll must be used within ScrollProvider");
  }

  return telemetry;
};
