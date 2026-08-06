import { useContext } from "react";

import { IScrollTelemetry } from "./scroll.types";
import { ScrollContext } from "./scroll-context";

/**
 * Телеметрия скролла из контекста; null — если экран её не предоставил
 * (потребитель решает сам: fallback-значение или бездействие).
 */
export const useScroll = (): IScrollTelemetry | null =>
  useContext(ScrollContext);
