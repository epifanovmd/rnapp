import type { CameraOrientation } from "react-native-vision-camera";
import type { OcrBufferOrientation } from "react-native-vision-engine";

import { IOcrScanRect } from "./types";

/** Угол ориентации в конвенции VisionCamera */
const ORIENTATION_DEGREES: Record<CameraOrientation, number> = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
};

/** Ориентация по четверти оборота (индекс — градусы / 90) */
const ORIENTATION_BY_QUARTER: CameraOrientation[] = [
  "up",
  "right",
  "down",
  "left",
];

/**
 * Доворот нормализованного прямоугольника, отменяющий поворот `orientation`
 * (конвенция VisionCamera `CameraOrientation`: "left" — содержимое повёрнуто
 * на 90° влево, поэтому координаты доворачиваются на 90° вправо).
 */
function rotateRect(
  rect: IOcrScanRect,
  orientation: CameraOrientation,
): IOcrScanRect {
  "worklet";

  const { x, y, width, height } = rect;

  switch (orientation) {
    case "down":
      return { x: 1 - x - width, y: 1 - y - height, width, height };
    case "left":
      return { x: 1 - y - height, y: x, width: height, height: width };
    case "right":
      return { x: y, y: 1 - x - width, width: height, height: width };
    default:
      return rect;
  }
}

/** Отражение нормализованного прямоугольника по горизонтали */
function mirrorRect(rect: IOcrScanRect): IOcrScanRect {
  "worklet";

  return {
    x: 1 - rect.x - rect.width,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

/**
 * Нормализованный прямоугольник из системы координат буфера кадра →
 * координаты выпрямленного изображения (top-left origin).
 *
 * Ориентация приходит в конвенции VisionCamera (`CameraOrientation`, не
 * EXIF); зеркальные варианты — дополнительное отражение по горизонтали
 * выпрямленного изображения.
 */
export function toUprightRect(
  rect: IOcrScanRect,
  orientation: OcrBufferOrientation,
): IOcrScanRect {
  "worklet";

  switch (orientation) {
    case "down":
    case "left":
    case "right":
      return rotateRect(rect, orientation);
    case "upMirrored":
      return mirrorRect(rect);
    case "downMirrored":
      return mirrorRect(rotateRect(rect, "down"));
    case "leftMirrored":
      return mirrorRect(rotateRect(rect, "left"));
    case "rightMirrored":
      return mirrorRect(rotateRect(rect, "right"));
    default:
      return rect;
  }
}

/**
 * Расхождение систем координат кадра и превью.
 *
 * Кадры frame-output выпрямляются по ориентации, заданной
 * `orientationSource` камеры (устройство), а превью на обеих платформах
 * ориентацию выхода игнорирует и всегда идёт по ориентации интерфейса.
 * Пока телефон держат по интерфейсу, пространства совпадают; при повороте
 * расходятся ровно на эту разницу.
 */
export function previewOrientationDelta(
  deviceOrientation: CameraOrientation,
  interfaceOrientation: CameraOrientation,
): CameraOrientation {
  "worklet";

  const degrees =
    (ORIENTATION_DEGREES[deviceOrientation] -
      ORIENTATION_DEGREES[interfaceOrientation] +
      360) %
    360;

  return ORIENTATION_BY_QUARTER[degrees / 90];
}

/** Прямоугольник выпрямленного кадра → координаты превью */
export function toPreviewRect(
  rect: IOcrScanRect,
  previewOrientation: CameraOrientation,
): IOcrScanRect {
  "worklet";

  return rotateRect(rect, previewOrientation);
}

/** Доворот на четверть меняет местами стороны кадра относительно превью */
export function swapsFrameSides(
  previewOrientation: CameraOrientation,
): boolean {
  "worklet";

  return previewOrientation === "left" || previewOrientation === "right";
}
