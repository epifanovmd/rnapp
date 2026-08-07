import { IOcrScanRect } from "./types";

export interface IViewSize {
  width: number;
  height: number;
}

/**
 * Нормализованный [0..1] прямоугольник выпрямленного кадра → координаты
 * вью камеры (resizeMode="cover": масштаб по большей стороне + центрирование).
 */
export function mapRectToView(
  rect: IOcrScanRect,
  imageWidth: number,
  imageHeight: number,
  view: IViewSize,
): IOcrScanRect {
  "worklet";

  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    view.width <= 0 ||
    view.height <= 0
  ) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.max(view.width / imageWidth, view.height / imageHeight);
  const offsetX = (view.width - imageWidth * scale) / 2;
  const offsetY = (view.height - imageHeight * scale) / 2;

  return {
    x: rect.x * imageWidth * scale + offsetX,
    y: rect.y * imageHeight * scale + offsetY,
    width: rect.width * imageWidth * scale,
    height: rect.height * imageHeight * scale,
  };
}
