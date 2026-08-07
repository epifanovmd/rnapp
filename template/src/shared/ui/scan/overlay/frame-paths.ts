import { IScanOverlayBox, TScanOverlayBoxKind } from "@shared/lib/scan-overlay";
import { Skia, SkPath } from "@shopify/react-native-skia";

/**
 * Скруглённые рамки боксов заданной категории (боксы — в пикселях вью).
 * Строится в UI-worklet'е для Skia `<Path>`.
 */
export function buildBoxesPath(
  boxes: IScanOverlayBox[],
  kind: TScanOverlayBoxKind,
): SkPath {
  "worklet";

  const builder = Skia.PathBuilder.Make();

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    if (box.kind !== kind) {
      continue;
    }
    builder.addRRect(
      Skia.RRectXY(
        Skia.XYWHRect(box.rect.x, box.rect.y, box.rect.width, box.rect.height),
        4,
        4,
      ),
    );
  }

  return builder.detach();
}

/** Уголки-скобки (как у QR-сканеров) для боксов заданной категории */
export function buildCornersPath(
  boxes: IScanOverlayBox[],
  kind: TScanOverlayBoxKind,
): SkPath {
  "worklet";

  const builder = Skia.PathBuilder.Make();

  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];

    if (box.kind !== kind) {
      continue;
    }
    const inset = 6;
    const x = box.rect.x - inset;
    const y = box.rect.y - inset;
    const width = box.rect.width + inset * 2;
    const height = box.rect.height + inset * 2;
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
