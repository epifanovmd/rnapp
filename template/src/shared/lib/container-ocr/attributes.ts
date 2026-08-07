import type { IOcrScanCandidate, IOcrScanResolved } from "@shared/lib/ocr-scan";
import type { OcrObservation } from "react-native-vision-engine";

import { IContainerRect } from "./types";

/** Веса и объём с таблички контейнера (частично — что удалось прочитать) */
export interface IContainerWeights {
  /** MAX GROSS, кг */
  maxGrossKg: number | null;
  /** TARE, кг */
  tareKg: number | null;
  /** NET / PAYLOAD, кг */
  netKg: number | null;
  /** CU CAP, м³ */
  cubicCapacityM3: number | null;
}

/** Атрибуты контейнера, накапливаемые по кадрам за сессию сканирования */
export interface IContainerAttributes {
  /** Size-type код ISO 6346, например "45G1" */
  sizeTypeCode: string | null;
  weights: IContainerWeights;
  /** Голоса за валидные коды между кадрами (код → сколько раз прочитан) */
  codeVotes: Record<string, number>;
  /** Лучшая уверенность OCR по каждому коду */
  codeConfidence: Record<string, number>;
}

export const EMPTY_CONTAINER_ATTRIBUTES: IContainerAttributes = {
  sizeTypeCode: null,
  weights: {
    maxGrossKg: null,
    tareKg: null,
    netKg: null,
    cubicCapacityM3: null,
  },
  codeVotes: {},
  codeConfidence: {},
};

/** Сколько голосов (не обязательно подряд) подтверждают код */
const CODE_CONFIRM_VOTES = 3;

/** Символы длины size-type (первый знак) */
const SIZE_LENGTH_CHARS = "123456789ABCDEFGHKLMNP";
/** Группы типа (третий знак) */
const SIZE_TYPE_CHARS = "GVBSRHUPTA";
/** OCR-путаницы цифра → буква для знака типа */
const TYPE_CHAR_SUBST: Record<string, string> = {
  "6": "G",
  "8": "B",
  "5": "S",
  "0": "U",
};

interface ILine {
  text: string;
  rect: IContainerRect;
}

/**
 * Склейка OCR-областей в текстовые строки: области с пересекающимися
 * вертикальными диапазонами считаются одной строкой (слева направо).
 */
function joinLines(observations: OcrObservation[]): ILine[] {
  "worklet";

  const sorted = observations
    .slice()
    .sort(
      (a, b) => a.rect.y + a.rect.height / 2 - (b.rect.y + b.rect.height / 2),
    );
  const lines: { items: OcrObservation[]; centerY: number; height: number }[] =
    [];

  for (let i = 0; i < sorted.length; i++) {
    const observation = sorted[i];
    const centerY = observation.rect.y + observation.rect.height / 2;
    const last = lines[lines.length - 1];

    if (
      last !== undefined &&
      Math.abs(centerY - last.centerY) <
        Math.max(observation.rect.height, last.height) * 0.6
    ) {
      last.items.push(observation);
    } else {
      lines.push({
        items: [observation],
        centerY,
        height: observation.rect.height,
      });
    }
  }

  return lines.map(line => {
    const items = line.items.slice().sort((a, b) => a.rect.x - b.rect.x);
    let text = "";
    let rect = items[0].rect;

    for (let i = 0; i < items.length; i++) {
      text += (i > 0 ? " " : "") + items[i].text;
      const other = items[i].rect;
      const x = Math.min(rect.x, other.x);
      const y = Math.min(rect.y, other.y);

      rect = {
        x,
        y,
        width: Math.max(rect.x + rect.width, other.x + other.width) - x,
        height: Math.max(rect.y + rect.height, other.y + other.height) - y,
      };
    }

    return { text: text.toUpperCase(), rect };
  });
}

/**
 * Число из надписи веса: "30.480" / "30,480" — тысячные разделители
 * (30480), "76.4" — десятичная дробь.
 */
function parseWeightNumber(raw: string): number | null {
  "worklet";

  const cleaned = raw.replace(/\s/g, "");

  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
    return parseInt(cleaned.replace(/[.,]/g, ""), 10);
  }
  const value = parseFloat(cleaned.replace(",", "."));

  return isNaN(value) ? null : value;
}

/**
 * Первое число с единицей из строки, например "30.480 KGS" → 30480.
 * Паттерн создаётся внутри worklet'а: RegExp из module-scope не переживает
 * сериализацию в worklet-рантайм (превращается в объект без методов).
 */
function matchKg(text: string): number | null {
  "worklet";

  const match = /([0-9][0-9.,]*)\s*K[G6][S5]?\b/.exec(text);

  return match === null ? null : parseWeightNumber(match[1]);
}

/** Первый объём в м³ из строки, например "76.4 CU.M" → 76.4 */
function matchM3(text: string): number | null {
  "worklet";

  const match = /([0-9][0-9.,]*)\s*(?:CU\.?\s?M|M3|CBM)\b/.exec(text);

  return match === null ? null : parseWeightNumber(match[1]);
}

function isDigitChar(char: string): boolean {
  "worklet";

  return char >= "0" && char <= "9";
}

/** Size-type код из отдельного 4-символьного токена ("45G1", "L5G1") */
function extractSizeType(text: string): string | null {
  "worklet";

  const tokens = text.split(/[^A-Z0-9]+/);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];

    if (token.length !== 4) {
      continue;
    }
    const typeChar = TYPE_CHAR_SUBST[token[2]] ?? token[2];

    if (
      SIZE_LENGTH_CHARS.indexOf(token[0]) !== -1 &&
      /[0-9A-Z]/.test(token[1]) &&
      SIZE_TYPE_CHARS.indexOf(typeChar) !== -1 &&
      isDigitChar(token[3]) &&
      // хотя бы один из знаков размера — цифра, иначе это слово
      (isDigitChar(token[0]) || isDigitChar(token[1]))
    ) {
      return token.slice(0, 2) + typeChar + token[3];
    }
  }

  return null;
}

/**
 * Извлечение атрибутов контейнера (size-type, веса) из OCR-областей кадра.
 * Метки и значения часто распознаются отдельными областями — сначала
 * области склеиваются в строки по вертикальному положению.
 */
export function extractContainerAttributes(
  observations: OcrObservation[],
): IContainerAttributes {
  "worklet";

  const result: IContainerAttributes = {
    sizeTypeCode: null,
    weights: {
      maxGrossKg: null,
      tareKg: null,
      netKg: null,
      cubicCapacityM3: null,
    },
    codeVotes: {},
    codeConfidence: {},
  };
  const lines = joinLines(observations);

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i].text;

    if (result.sizeTypeCode === null) {
      result.sizeTypeCode = extractSizeType(text);
    }

    if (/MAX[\s.]*(GROSS|WT|WEIGHT)|GROSS/.test(text)) {
      result.weights.maxGrossKg = matchKg(text) ?? result.weights.maxGrossKg;
    } else if (/\bTARE\b/.test(text)) {
      result.weights.tareKg = matchKg(text) ?? result.weights.tareKg;
    } else if (/\bNET\b|PAYLOAD/.test(text)) {
      result.weights.netKg = matchKg(text) ?? result.weights.netKg;
    } else if (/CU[\s.]*CAP|CAPACITY|\bCUBE\b/.test(text)) {
      result.weights.cubicCapacityM3 =
        matchM3(text) ?? result.weights.cubicCapacityM3;
    }
  }

  return result;
}

/** Слияние атрибутов между кадрами: новое непустое значение перекрывает */
export function mergeContainerAttributes(
  accumulated: IContainerAttributes,
  next: IContainerAttributes,
): IContainerAttributes {
  "worklet";

  return {
    sizeTypeCode: next.sizeTypeCode ?? accumulated.sizeTypeCode,
    weights: {
      maxGrossKg: next.weights.maxGrossKg ?? accumulated.weights.maxGrossKg,
      tareKg: next.weights.tareKg ?? accumulated.weights.tareKg,
      netKg: next.weights.netKg ?? accumulated.weights.netKg,
      cubicCapacityM3:
        next.weights.cubicCapacityM3 ?? accumulated.weights.cubicCapacityM3,
    },
    codeVotes: accumulated.codeVotes,
    codeConfidence: accumulated.codeConfidence,
  };
}

/**
 * Межкадровое голосование: каждый валидный кандидат кадра добавляет голос
 * своему коду — код не обязан читаться целиком в сканах подряд.
 */
export function accumulateContainerCandidates(
  accumulated: IContainerAttributes,
  candidates: IOcrScanCandidate[],
): IContainerAttributes {
  "worklet";

  const codeVotes: Record<string, number> = { ...accumulated.codeVotes };
  const codeConfidence: Record<string, number> = {
    ...accumulated.codeConfidence,
  };

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    if (!candidate.isValid) {
      continue;
    }
    codeVotes[candidate.value] = (codeVotes[candidate.value] ?? 0) + 1;
    codeConfidence[candidate.value] = Math.max(
      codeConfidence[candidate.value] ?? 0,
      candidate.confidence,
    );
  }

  return { ...accumulated, codeVotes, codeConfidence };
}

/**
 * Вывод кода из накопленных голосов: побеждает код, набравший
 * CODE_CONFIRM_VOTES (валидность каждого голоса уже проверена
 * контрольной цифрой). null — голосов пока недостаточно.
 */
export function resolveContainerCode(
  attributes: IContainerAttributes,
): IOcrScanResolved | null {
  "worklet";

  let bestCode: string | null = null;
  let bestVotes = 0;
  const codes = Object.keys(attributes.codeVotes);

  for (let i = 0; i < codes.length; i++) {
    const votes = attributes.codeVotes[codes[i]];

    if (votes > bestVotes) {
      bestVotes = votes;
      bestCode = codes[i];
    }
  }
  if (bestCode === null || bestVotes < CODE_CONFIRM_VOTES) {
    return null;
  }

  return {
    value: bestCode,
    confidence: attributes.codeConfidence[bestCode] ?? 0,
  };
}
