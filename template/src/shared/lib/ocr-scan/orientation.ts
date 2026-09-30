import type { CameraOrientation } from "react-native-vision-camera";

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
const rotateRect = (
  rect: IOcrScanRect,
  orientation: CameraOrientation,
): IOcrScanRect => {
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
};

/**
 * Расхождение систем координат кадра и превью.
 *
 * Кадры frame-output выпрямляются по ориентации, заданной
 * `orientationSource` камеры (устройство), а превью на обеих платформах
 * ориентацию выхода игнорирует и всегда идёт по ориентации интерфейса.
 * Пока телефон держат по интерфейсу, пространства совпадают; при повороте
 * расходятся ровно на эту разницу.
 */
export const previewOrientationDelta = (
  deviceOrientation: CameraOrientation,
  interfaceOrientation: CameraOrientation,
): CameraOrientation => {
  "worklet";

  const degrees =
    (ORIENTATION_DEGREES[deviceOrientation] -
      ORIENTATION_DEGREES[interfaceOrientation] +
      360) %
    360;

  return ORIENTATION_BY_QUARTER[degrees / 90];
};

/** Прямоугольник выпрямленного кадра → координаты превью */
export const toPreviewRect = (
  rect: IOcrScanRect,
  previewOrientation: CameraOrientation,
): IOcrScanRect => {
  "worklet";

  return rotateRect(rect, previewOrientation);
};

/** Доворот на четверть меняет местами стороны кадра относительно превью */
export const swapsFrameSides = (
  previewOrientation: CameraOrientation,
): boolean => {
  "worklet";

  return previewOrientation === "left" || previewOrientation === "right";
};
