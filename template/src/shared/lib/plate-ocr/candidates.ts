import { IOcrScanObservation, IOcrScanRect } from "@shared/lib/ocr-scan";

import { IPlateCandidate } from "./types";

/**
 * Буквы, разрешённые в российских номерах (ГОСТ Р 50577) — кириллица,
 * визуально совпадающая с латиницей; латинский OCR читает их как ABEKMHOPCTYX.
 */
const ALLOWED_LETTERS = "ABEKMHOPCTYX";

/** Похожие на буквы цифры → буквы номера */
const TO_LETTER: Record<string, string> = {
  "0": "O",
  "8": "B",
};

/** Похожие на цифры буквы → цифры */
const TO_DIGIT: Record<string, string> = {
  O: "0",
  Q: "0",
  D: "0",
  I: "1",
  L: "1",
  Z: "2",
  S: "5",
  G: "6",
  B: "8",
};

const MAX_COMBINATIONS = 24;
const MAX_CANDIDATES = 5;

interface ISource {
  text: string;
  confidence: number;
  rect: IOcrScanRect;
}

function isDigit(char: string): boolean {
  "worklet";

  return char >= "0" && char <= "9";
}

/** Символ → буква номера; null — не приводится */
function toPlateLetter(char: string): string | null {
  "worklet";

  const letter = TO_LETTER[char] ?? char;

  return ALLOWED_LETTERS.indexOf(letter) === -1 ? null : letter;
}

/** Символ → цифра; null — не приводится */
function toPlateDigit(char: string): string | null {
  "worklet";

  if (isDigit(char)) {
    return char;
  }

  return TO_DIGIT[char] ?? null;
}

/** Регион: "01".."99" либо трёхзначный, начинающийся не с нуля */
function isValidRegion(region: string): boolean {
  "worklet";

  if (region.length === 2) {
    return region !== "00";
  }

  return region[0] !== "0";
}

/**
 * Окно из 8–9 символов → номер формата "L DDD LL RR(R)"; null — не совпало.
 * У номеров нет контрольной цифры, поэтому подстановки детерминированные.
 */
function normalizeWindow(window: string): string | null {
  "worklet";

  const letterPositions = [0, 4, 5];
  let result = "";

  for (let i = 0; i < window.length; i++) {
    const isLetterPosition = letterPositions.indexOf(i) !== -1;
    const char = isLetterPosition
      ? toPlateLetter(window[i])
      : toPlateDigit(window[i]);

    if (char === null) {
      return null;
    }
    result += char;
  }
  if (!isValidRegion(result.slice(6))) {
    return null;
  }

  return result;
}

function collectFromSource(
  source: ISource,
  candidates: IPlateCandidate[],
): void {
  "worklet";

  const cleaned = source.text.toUpperCase().replace(/[^A-Z0-9]/g, "");

  for (let length = 9; length >= 8; length--) {
    for (let i = 0; i + length <= cleaned.length; i++) {
      const normalized = normalizeWindow(cleaned.slice(i, i + length));

      if (normalized === null) {
        continue;
      }
      candidates.push({
        value: normalized,
        isValid: true,
        confidence: source.confidence,
        rect: source.rect,
      });
    }
  }
}

function unionRect(a: IOcrScanRect, b: IOcrScanRect): IOcrScanRect {
  "worklet";

  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);

  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** Области близки настолько, что могут быть частями одного номера */
function areAdjacent(a: IOcrScanRect, b: IOcrScanRect): boolean {
  "worklet";

  const refSize = Math.max(a.height, b.height);
  const horizontalGap =
    Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width);
  const verticalGap =
    Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height);

  return horizontalGap < refSize * 2.5 && verticalGap < refSize * 1.5;
}

/**
 * Извлечение кандидатов автономера из OCR-областей кадра: одиночные
 * области и пары соседних (основная часть и регион печатаются раздельно).
 */
export function extractPlateCandidates(
  observations: IOcrScanObservation[],
): IPlateCandidate[] {
  "worklet";

  const candidates: IPlateCandidate[] = [];
  const sources: ISource[] = [];

  for (let i = 0; i < observations.length; i++) {
    sources.push({
      text: observations[i].text,
      confidence: observations[i].confidence,
      rect: observations[i].rect,
    });
    collectFromSource(sources[sources.length - 1], candidates);
  }

  let combinations = 0;

  for (let i = 0; i < sources.length && combinations < MAX_COMBINATIONS; i++) {
    for (
      let j = 0;
      j < sources.length && combinations < MAX_COMBINATIONS;
      j++
    ) {
      if (i === j || !areAdjacent(sources[i].rect, sources[j].rect)) {
        continue;
      }
      combinations++;
      collectFromSource(
        {
          text: sources[i].text + sources[j].text,
          confidence: Math.min(sources[i].confidence, sources[j].confidence),
          rect: unionRect(sources[i].rect, sources[j].rect),
        },
        candidates,
      );
    }
  }

  // дедупликация по значению, более уверенный кандидат выигрывает
  const byValue: Record<string, IPlateCandidate> = {};

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const existing = byValue[candidate.value];

    if (existing === undefined || candidate.confidence > existing.confidence) {
      byValue[candidate.value] = candidate;
    }
  }

  const result: IPlateCandidate[] = [];
  const values = Object.keys(byValue);

  for (let i = 0; i < values.length; i++) {
    result.push(byValue[values[i]]);
  }
  result.sort((a, b) => b.confidence - a.confidence);

  return result.slice(0, MAX_CANDIDATES);
}
