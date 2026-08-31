import { useContext } from "react";

import { IScrollTelemetry } from "./scroll.types";
import { ScrollContext } from "./scroll-context";

/**
 * Телеметрия ближайшего скролла; null — экран её не предоставил
 * (потребитель решает сам: fallback-значение или бездействие).
 */
export const useScroll = (): IScrollTelemetry | null =>
  useContext(ScrollContext);
