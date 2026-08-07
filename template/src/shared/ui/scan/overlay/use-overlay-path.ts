import { IScanOverlayBox, IViewSize } from "@shared/lib/scan-overlay";
import { SkPath } from "@shopify/react-native-skia";
import type { DerivedValue } from "react-native-reanimated";
import { useDerivedValue } from "react-native-reanimated";

import { IScanOverlayApi } from "./ScanOverlayHost";

/**
 * Кастомная геометрия поверх боксов оверлея: `build` — worklet, получает
 * сглаженные боксы в пикселях вью и размер канваса, возвращает SkPath
 * для собственного Skia-слоя.
 */
export function useOverlayPath(
  api: IScanOverlayApi,
  build: (boxes: IScanOverlayBox[], size: IViewSize) => SkPath,
): DerivedValue<SkPath> {
  return useDerivedValue(
    () => build(api.boxes.value, api.size.value),
    [api.boxes, api.size, build],
  );
}
