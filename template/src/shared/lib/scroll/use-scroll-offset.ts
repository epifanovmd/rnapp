import { SharedValue, useSharedValue } from "react-native-reanimated";

import { IScrollTelemetry } from "./scroll.types";
import { useScroll } from "./use-scroll";

/**
 * Вертикальный офсет скролла для анимаций: переданного источника, иначе
 * ближайшего из ScrollProvider. Скролла нет — возвращается константный 0,
 * поэтому компонент одинаково работает и на статичном экране.
 */
export const useScrollOffsetY = (
  source?: IScrollTelemetry | null,
): SharedValue<number> => {
  const fallback = useSharedValue(0);
  const nearest = useScroll();
  const telemetry = source === undefined ? nearest : source;

  return telemetry?.offsetY ?? fallback;
};
