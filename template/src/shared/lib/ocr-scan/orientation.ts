import type { OcrBufferOrientation } from "react-native-vision-engine";

import { IOcrScanRect } from "./types";

/**
 * Нормализованный прямоугольник из системы координат буфера кадра →
 * координаты выпрямленного изображения (top-left origin).
 *
 * Ориентация приходит в конвенции VisionCamera (`CameraOrientation`, не
 * EXIF): "left" — содержимое кадра повёрнуто на 90° влево относительно
 * выпрямленного («что было сверху — стало слева»), поэтому для
 * выпрямления координаты вращаются на 90° вправо; "right" — наоборот.
 * Зеркальные варианты — дополнительное отражение по горизонтали
 * выпрямленного изображения.
 */
export function toUprightRect(
  rect: IOcrScanRect,
  orientation: OcrBufferOrientation,
): IOcrScanRect {
  "worklet";

  const { x, y, width, height } = rect;

  switch (orientation) {
    case "up":
      return rect;
    case "upMirrored":
      return { x: 1 - x - width, y, width, height };
    case "down":
      return { x: 1 - x - width, y: 1 - y - height, width, height };
    case "downMirrored":
      return { x, y: 1 - y - height, width, height };
    case "left":
      // поворот координат на 90° вправо
      return { x: 1 - y - height, y: x, width: height, height: width };
    case "leftMirrored":
      return { x: y, y: x, width: height, height: width };
    case "right":
      // поворот координат на 90° влево
      return { x: y, y: 1 - x - width, width: height, height: width };
    case "rightMirrored":
      return {
        x: 1 - y - height,
        y: 1 - x - width,
        width: height,
        height: width,
      };
    default:
      return rect;
  }
}
