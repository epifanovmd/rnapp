import { IScanOverlayBox, IScanRect } from "./types";

export interface IViewSize {
  width: number;
  height: number;
}

/**
 * Нормализованный [0..1] прямоугольник выпрямленного кадра → координаты
 * вью камеры (resizeMode="cover": масштаб по большей стороне + центрирование).
 */
export function mapRectToView(
  rect: IScanRect,
  imageWidth: number,
  imageHeight: number,
  view: IViewSize,
): IScanRect {
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

/**
 * Боксы снимка → координаты вью, вырожденные отбрасываются.
 * Выполняется один раз на кадр в хосте оверлея — слои получают готовые пиксели.
 */
export function mapOverlayBoxes(
  boxes: IScanOverlayBox[],
  imageWidth: number,
  imageHeight: number,
  view: IViewSize,
): IScanOverlayBox[] {
  "worklet";

  const mapped: IScanOverlayBox[] = [];

  for (let i = 0; i < boxes.length; i++) {
    const rect = mapRectToView(boxes[i].rect, imageWidth, imageHeight, view);

    if (rect.width > 0 && rect.height > 0) {
      mapped.push({ rect, kind: boxes[i].kind, label: boxes[i].label });
    }
  }

  return mapped;
}
