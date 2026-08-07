import type { OcrObservation } from "react-native-ocr-engine";

import { computeIso6346CheckDigit } from "./iso6346";
import { IContainerCandidate, IContainerRect } from "./types";

/**
 * Похожие на буквы цифры → варианты букв (для префикса владельца).
 * Порядок — по убыванию вероятности; ложные комбинации отсеивает
 * контрольная цифра.
 */
const LETTER_ALTERNATIVES: Record<string, string[]> = {
  "0": ["O", "D", "Q", "C"],
  "1": ["I", "L"],
  "2": ["Z"],
  "4": ["A"],
  "5": ["S"],
  "6": ["G", "C"],
  "8": ["B"],
};

/** Похожие на цифры буквы → цифры (для серийной части) */
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

/** Максимум комбинаций областей, проверяемых на одном кадре */
const MAX_COMBINATIONS = 48;
const MAX_CANDIDATES = 5;
/** Максимум вариантов нормализации одного окна */
const MAX_WINDOW_VARIANTS = 32;

interface ISource {
  text: string;
  confidence: number;
  rect: IContainerRect;
}

function isLetter(char: string): boolean {
  "worklet";

  return char >= "A" && char <= "Z";
}

function isDigit(char: string): boolean {
  "worklet";

  return char >= "0" && char <= "9";
}

/**
 * Позиционная нормализация окна из 11 символов под шаблон ISO 6346
 * (4 буквы + 7 цифр) с исправлением типичных OCR-путаниц. Неоднозначные
 * символы дают несколько вариантов (первый — наиболее вероятный);
 * ложные варианты отбрасывает проверка контрольной цифры.
 */
function normalizeWindowVariants(window: string): string[] {
  "worklet";

  const optionsPerPosition: string[][] = [];

  for (let i = 0; i < 4; i++) {
    const char = window[i];

    if (isLetter(char)) {
      optionsPerPosition.push([char]);
    } else if (LETTER_ALTERNATIVES[char] !== undefined) {
      optionsPerPosition.push(LETTER_ALTERNATIVES[char]);
    } else {
      return [];
    }
  }
  // категория оборудования — только U/J/Z
  const categoryOptions = optionsPerPosition[3].filter(
    option => option === "U" || option === "J" || option === "Z",
  );

  if (categoryOptions.length === 0) {
    return [];
  }
  optionsPerPosition[3] = categoryOptions;

  for (let i = 4; i < 11; i++) {
    const char = window[i];

    if (isDigit(char)) {
      optionsPerPosition.push([char]);
    } else if (TO_DIGIT[char] !== undefined) {
      optionsPerPosition.push([TO_DIGIT[char]]);
    } else {
      return [];
    }
  }

  let variants: string[] = [""];

  for (let i = 0; i < optionsPerPosition.length; i++) {
    const options = optionsPerPosition[i];
    const next: string[] = [];

    for (let j = 0; j < variants.length; j++) {
      for (
        let k = 0;
        k < options.length && next.length < MAX_WINDOW_VARIANTS;
        k++
      ) {
        next.push(variants[j] + options[k]);
      }
    }
    variants = next;
  }

  return variants;
}

function unionRect(a: IContainerRect, b: IContainerRect): IContainerRect {
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

/** Области близки настолько, что могут быть частями одного кода */
function areAdjacent(a: IContainerRect, b: IContainerRect): boolean {
  "worklet";

  const refSize = Math.max(a.height, b.height);
  const horizontalGap =
    Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width);
  const verticalGap =
    Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height);

  return horizontalGap < refSize * 2.5 && verticalGap < refSize * 1.5;
}

function collectFromSource(
  source: ISource,
  candidates: IContainerCandidate[],
): void {
  "worklet";

  const cleaned = source.text.toUpperCase().replace(/[^A-Z0-9]/g, "");

  for (let i = 0; i + 11 <= cleaned.length; i++) {
    const variants = normalizeWindowVariants(cleaned.slice(i, i + 11));

    for (let v = 0; v < variants.length; v++) {
      const variant = variants[v];
      const checkDigit = variant.charCodeAt(10) - 48;
      const isValid = computeIso6346CheckDigit(variant) === checkDigit;

      // первый вариант — самый вероятный, попадает в кандидаты всегда
      // (для оверлея); остальные — только когда контрольная цифра сошлась
      if (v === 0 || isValid) {
        candidates.push({
          code: variant,
          isValid,
          confidence: source.confidence,
          rect: source.rect,
        });
      }
    }
  }
}

/**
 * Извлечение кандидатов кода ISO 6346 из OCR-областей кадра.
 * Проверяются одиночные области, пары соседних (код, разбитый на
 * владельца и номер) и вертикальные стопки коротких фрагментов.
 */
export function extractContainerCandidates(
  observations: OcrObservation[],
): IContainerCandidate[] {
  "worklet";

  const candidates: IContainerCandidate[] = [];
  const sources: ISource[] = [];

  for (let i = 0; i < observations.length; i++) {
    const observation = observations[i];

    sources.push({
      text: observation.text,
      confidence: observation.confidence,
      rect: observation.rect,
    });
    collectFromSource(sources[sources.length - 1], candidates);
  }

  // В склейке участвуют только фрагментоподобные области (1–8 символов:
  // владелец, серийник, цифра в рамке) — иначе бюджет комбинаций сгорает
  // на постороннем длинном тексте, попавшем в кадр.
  const fragments = sources.filter(source => {
    const length = source.text.replace(/[^A-Za-z0-9]/g, "").length;

    return length >= 1 && length <= 8;
  });

  // пары соседних областей: "MSCU" + "123456 7"
  let combinations = 0;

  for (
    let i = 0;
    i < fragments.length && combinations < MAX_COMBINATIONS;
    i++
  ) {
    for (
      let j = 0;
      j < fragments.length && combinations < MAX_COMBINATIONS;
      j++
    ) {
      if (i === j || !areAdjacent(fragments[i].rect, fragments[j].rect)) {
        continue;
      }
      combinations++;
      const pairSource: ISource = {
        text: fragments[i].text + fragments[j].text,
        confidence: Math.min(fragments[i].confidence, fragments[j].confidence),
        rect: unionRect(fragments[i].rect, fragments[j].rect),
      };

      collectFromSource(pairSource, candidates);

      // код часто разбит на ТРИ области: владелец + серийник + контрольная
      // цифра в отдельной рамке — доклеиваем короткий соседний фрагмент
      for (
        let k = 0;
        k < fragments.length && combinations < MAX_COMBINATIONS;
        k++
      ) {
        if (k === i || k === j) {
          continue;
        }
        const fragment = fragments[k].text.replace(/[^A-Za-z0-9]/g, "");

        if (
          fragment.length === 0 ||
          fragment.length > 2 ||
          !areAdjacent(pairSource.rect, fragments[k].rect)
        ) {
          continue;
        }
        combinations++;
        collectFromSource(
          {
            text: pairSource.text + fragments[k].text,
            confidence: Math.min(
              pairSource.confidence,
              fragments[k].confidence,
            ),
            rect: unionRect(pairSource.rect, fragments[k].rect),
          },
          candidates,
        );
      }
    }
  }

  // вертикальная стопка коротких фрагментов (код, нанесённый столбцом)
  const shortSources = fragments.filter(
    source => source.text.replace(/[^A-Za-z0-9]/g, "").length <= 4,
  );

  if (shortSources.length >= 3) {
    const stack = shortSources.slice().sort((a, b) => a.rect.y - b.rect.y);
    let text = "";
    let confidence = 1;
    let rect = stack[0].rect;

    for (let i = 0; i < stack.length; i++) {
      text += stack[i].text;
      confidence = Math.min(confidence, stack[i].confidence);
      rect = unionRect(rect, stack[i].rect);
    }
    collectFromSource({ text, confidence, rect }, candidates);
  }

  // дедупликация по коду: валидный и более уверенный кандидат выигрывает
  const byCode: Record<string, IContainerCandidate> = {};

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];
    const existing = byCode[candidate.code];

    if (
      existing === undefined ||
      (candidate.isValid && !existing.isValid) ||
      (candidate.isValid === existing.isValid &&
        candidate.confidence > existing.confidence)
    ) {
      byCode[candidate.code] = candidate;
    }
  }

  const result: IContainerCandidate[] = [];
  const codes = Object.keys(byCode);

  for (let i = 0; i < codes.length; i++) {
    result.push(byCode[codes[i]]);
  }
  result.sort((a, b) => {
    if (a.isValid !== b.isValid) {
      return a.isValid ? -1 : 1;
    }

    return b.confidence - a.confidence;
  });

  return result.slice(0, MAX_CANDIDATES);
}
