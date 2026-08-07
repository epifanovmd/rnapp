import { IScanOverlayBox, IScanRect } from "./types";

/** Доля пути к цели за один UI-кадр (~60 fps): выше — резче, ниже — плавнее */
const LERP_FACTOR = 0.35;
/** Ближе этого порога (в нормализованных координатах) — прилипание к цели */
const SNAP_EPSILON = 0.0015;
/** Радиус сопоставления рамок между сканами, в долях размера цели */
const MATCH_DISTANCE_FACTOR = 1.5;

export interface ISmoothingResult {
  boxes: IScanOverlayBox[];
  /** Анимация сошлась — перезаписывать shared value не нужно */
  settled: boolean;
}

function lerp(from: number, to: number): number {
  "worklet";

  const next = from + (to - from) * LERP_FACTOR;

  return Math.abs(to - next) < SNAP_EPSILON ? to : next;
}

function centerDistance(a: IScanRect, b: IScanRect): number {
  "worklet";

  const dx = a.x + a.width / 2 - (b.x + b.width / 2);
  const dy = a.y + a.height / 2 - (b.y + b.height / 2);

  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Плавное движение рамок к целям очередного скана: каждая цель находит
 * ближайшую отображаемую рамку той же группы и интерполируется от неё,
 * несопоставленные появляются сразу на месте.
 */
export function smoothBoxes(
  displayed: IScanOverlayBox[],
  targets: IScanOverlayBox[],
): ISmoothingResult {
  "worklet";

  const result: IScanOverlayBox[] = [];
  const used: boolean[] = new Array(displayed.length).fill(false);
  let settled = displayed.length === targets.length;

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const maxDistance =
      Math.max(target.rect.width, target.rect.height) * MATCH_DISTANCE_FACTOR;
    let matchIndex = -1;
    let matchDistance = maxDistance;

    for (let j = 0; j < displayed.length; j++) {
      if (used[j] || displayed[j].kind !== target.kind) {
        continue;
      }
      const distance = centerDistance(displayed[j].rect, target.rect);

      if (distance < matchDistance) {
        matchDistance = distance;
        matchIndex = j;
      }
    }

    if (matchIndex === -1) {
      result.push(target);
      settled = false;
      continue;
    }

    used[matchIndex] = true;
    const from = displayed[matchIndex].rect;
    const next: IScanRect = {
      x: lerp(from.x, target.rect.x),
      y: lerp(from.y, target.rect.y),
      width: lerp(from.width, target.rect.width),
      height: lerp(from.height, target.rect.height),
    };

    if (
      next.x !== target.rect.x ||
      next.y !== target.rect.y ||
      next.width !== target.rect.width ||
      next.height !== target.rect.height
    ) {
      settled = false;
    }
    result.push({ rect: next, kind: target.kind, label: target.label });
  }

  return { boxes: result, settled };
}
