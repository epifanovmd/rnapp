import { IContainerCodeParts, IContainerSizeType } from "./types";

/**
 * Значения букв по ISO 6346 (кратные 11 значения пропущены: 11, 22, 33).
 */
const LETTER_VALUES: Record<string, number> = {
  A: 10,
  B: 12,
  C: 13,
  D: 14,
  E: 15,
  F: 16,
  G: 17,
  H: 18,
  I: 19,
  J: 20,
  K: 21,
  L: 23,
  M: 24,
  N: 25,
  O: 26,
  P: 27,
  Q: 28,
  R: 29,
  S: 30,
  T: 31,
  U: 32,
  V: 34,
  W: 35,
  X: 36,
  Y: 37,
  Z: 38,
};

/** Допустимые категории оборудования */
const CATEGORIES = "UJZ";

/**
 * Контрольная цифра ISO 6346 для первых 10 символов кода
 * (4 буквы + 6 цифр). Возвращает -1 для некорректного входа.
 */
export function computeIso6346CheckDigit(code10: string): number {
  "worklet";

  if (code10.length < 10) {
    return -1;
  }

  let sum = 0;
  let weight = 1;

  for (let i = 0; i < 10; i++) {
    const char = code10[i];
    let value: number;

    if (i < 4) {
      const letterValue = LETTER_VALUES[char];

      if (letterValue === undefined) {
        return -1;
      }
      value = letterValue;
    } else {
      const digit = char.charCodeAt(0) - 48;

      if (digit < 0 || digit > 9) {
        return -1;
      }
      value = digit;
    }
    sum += value * weight;
    weight *= 2;
  }

  return (sum % 11) % 10;
}

/** Полная проверка кода из 11 символов: формат + контрольная цифра */
export function isValidIso6346(code: string): boolean {
  "worklet";

  if (code.length !== 11) {
    return false;
  }
  if (CATEGORIES.indexOf(code[3]) === -1) {
    return false;
  }
  const checkDigit = code.charCodeAt(10) - 48;

  if (checkDigit < 0 || checkDigit > 9) {
    return false;
  }

  return computeIso6346CheckDigit(code) === checkDigit;
}

/** Разбор кода из 11 символов на части; null — формат не совпал */
export function parseIso6346(code: string): IContainerCodeParts | null {
  "worklet";

  if (code.length !== 11) {
    return null;
  }
  for (let i = 0; i < 4; i++) {
    if (LETTER_VALUES[code[i]] === undefined) {
      return null;
    }
  }
  for (let i = 4; i < 11; i++) {
    const digit = code.charCodeAt(i) - 48;

    if (digit < 0 || digit > 9) {
      return null;
    }
  }

  return {
    owner: code.slice(0, 3),
    category: code[3],
    serial: code.slice(4, 10),
    checkDigit: code.charCodeAt(10) - 48,
  };
}

const SIZE_LENGTH: Record<string, string> = {
  "1": "10 футов",
  "2": "20 футов",
  "3": "30 футов",
  "4": "40 футов",
  B: "24 фута",
  G: "41 фут",
  L: "45 футов",
  M: "48 футов",
  N: "49 футов",
};

const SIZE_HEIGHT: Record<string, string> = {
  "0": "8'",
  "1": "8'",
  "2": "8'6\"",
  "3": "8'6\"",
  "4": "9'",
  "5": "9'6\" (high cube)",
  "6": "9'6\" (high cube)",
  "8": "4'3\"",
  "9": "до 4'",
};

const TYPE_GROUPS: Record<string, string> = {
  G: "универсальный (general purpose)",
  V: "вентилируемый",
  B: "насыпной (bulk)",
  S: "специализированный",
  R: "рефрижераторный",
  H: "изотермический",
  U: "open top",
  P: "платформа / flat rack",
  T: "танк-контейнер",
  A: "воздушный / поверхностный",
};

/**
 * Расшифровка size-type кода (4 символа, например "45G1" или "L5G1").
 * Возвращает null, если строка не похожа на size-type.
 */
export function decodeIso6346SizeType(code: string): IContainerSizeType | null {
  const normalized = code.toUpperCase();

  if (normalized.length !== 4) {
    return null;
  }
  const length = SIZE_LENGTH[normalized[0]];
  const height = SIZE_HEIGHT[normalized[1]];
  const type = TYPE_GROUPS[normalized[2]];

  if (!length || !height || !type) {
    return null;
  }

  return { code: normalized, length, height, type };
}

/** Известные владельцы (BIC-префиксы) для отображения имени линии */
const KNOWN_OWNERS: Record<string, string> = {
  MSC: "MSC — Mediterranean Shipping Company",
  MSK: "Maersk",
  MAE: "Maersk",
  MRK: "Maersk",
  CMA: "CMA CGM",
  CGM: "CMA CGM",
  COS: "COSCO Shipping",
  CSN: "COSCO Shipping",
  HLC: "Hapag-Lloyd",
  HLX: "Hapag-Lloyd",
  HPL: "Hapag-Lloyd",
  ONE: "Ocean Network Express",
  EGH: "Evergreen",
  EGS: "Evergreen",
  EIS: "Evergreen",
  EMC: "Evergreen",
  HMM: "HMM",
  YML: "Yang Ming",
  ZIM: "ZIM",
  OOL: "OOCL",
  OOC: "OOCL",
  FES: "FESCO",
  TKR: "Transkontejner",
  SKL: "Sinokor",
  TCK: "TransContainer",
  TCN: "TransContainer",
};

/** Имя судоходной линии по коду владельца; null — неизвестный код */
export function resolveOwnerName(owner: string): string | null {
  return KNOWN_OWNERS[owner.toUpperCase()] ?? null;
}

/** Формат для отображения: "MSCU 123456-7" */
export function formatContainerCode(code: string): string {
  if (code.length !== 11) {
    return code;
  }

  return `${code.slice(0, 4)} ${code.slice(4, 10)}-${code[10]}`;
}
