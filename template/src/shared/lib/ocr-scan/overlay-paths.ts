import { Skia, SkPath } from "@shopify/react-native-skia";

import { IViewSize, mapRectToView } from "./geometry";
import { IOcrOverlayBox } from "./types";

/**
 * Скруглённые рамки OCR-областей (isValidCandidate === filter).
 * Строится в UI-worklet'е для Skia `<Path>`.
 */
export function buildBoxesPath(
  boxes: IOcrOverlayBox[],
  image: IViewSize,
  view: IViewSize,
  filter: boolean | null,
): SkPath {
  "worklet";

  const builder = Skia.PathBuilder.Make();

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    if (box.isValidCandidate !== filter) {
      continue;
    }
    const rect = mapRectToView(box.rect, image.width, image.height, view);

    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }
    builder.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(rect.x, rect.y, rect.width, rect.height),
        4,
        4,
      ),
    );
  }

  return builder.detach();
}

/** Уголки-скобки (как у QR-сканеров) для кандидатов */
export function buildCornersPath(
  boxes: IOcrOverlayBox[],
  image: IViewSize,
  view: IViewSize,
  valid: boolean,
): SkPath {
  "worklet";

  const builder = Skia.PathBuilder.Make();

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    if (box.isValidCandidate !== valid) {
      continue;
    }
    const rect = mapRectToView(box.rect, image.width, image.height, view);

    if (rect.width <= 0 || rect.height <= 0) {
      continue;
    }
    const inset = 6;
    const x = rect.x - inset;
    const y = rect.y - inset;
    const width = rect.width + inset * 2;
    const height = rect.height + inset * 2;
    const arm = Math.min(Math.max(Math.min(width, height) * 0.28, 10), 26);

    builder
      .moveTo(x, y + arm)
      .lineTo(x, y)
      .lineTo(x + arm, y)
      .moveTo(x + width - arm, y)
      .lineTo(x + width, y)
      .lineTo(x + width, y + arm)
      .moveTo(x + width, y + height - arm)
      .lineTo(x + width, y + height)
      .lineTo(x + width - arm, y + height)
      .moveTo(x + arm, y + height)
      .lineTo(x, y + height)
      .lineTo(x, y + height - arm);
  }

  return builder.detach();
}
