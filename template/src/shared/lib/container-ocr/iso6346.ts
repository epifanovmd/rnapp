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

/** Категория оборудования — 4-я буква кода */
const EQUIPMENT_CATEGORIES: Record<string, string> = {
  U: "Грузовой контейнер (freight container)",
  J: "Съёмное оборудование (detachable equipment)",
  Z: "Шасси / трейлер (chassis / trailer)",
};

/** Расшифровка категории оборудования; неизвестная буква возвращается как есть */
export function decodeEquipmentCategory(category: string): string {
  return EQUIPMENT_CATEGORIES[category.toUpperCase()] ?? category;
}

/** Первый знак size-type — длина контейнера */
const SIZE_LENGTH: Record<string, string> = {
  "1": "10 футов (2991 мм)",
  "2": "20 футов (6058 мм)",
  "3": "30 футов (9125 мм)",
  "4": "40 футов (12 192 мм)",
  B: "24 фута (7315 мм)",
  C: "24½ фута (7430 мм)",
  G: "41 фут (12 497 мм)",
  H: "43 фута (13 106 мм)",
  L: "45 футов (13 716 мм)",
  M: "48 футов (14 630 мм)",
  N: "49 футов (14 935 мм)",
};

/** Второй знак size-type — высота (и ширина: буквы — кузов шире 2438 мм) */
const SIZE_HEIGHT: Record<string, string> = {
  "0": "8' (2438 мм)",
  "1": "8' (2438 мм)",
  "2": "8'6\" (2591 мм)",
  "3": "8'6\" (2591 мм)",
  "4": "9' (2743 мм)",
  "5": "9'6\" (2896 мм) — high cube",
  "6": "выше 9'6\" (> 2896 мм)",
  "8": "4'3\" (1295 мм)",
  "9": "до 4' (≤ 1219 мм)",
  C: "8'6\" (2591 мм), ширина 2500 мм",
  D: "9' (2743 мм), ширина 2500 мм",
  E: "9'6\" (2896 мм), ширина 2500 мм",
  F: "выше 9'6\", ширина 2500 мм",
};

/** Группа типа по первой букве пары */
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
  A: "воздушный / наземный (air/surface)",
};

/** Точная расшифровка пары знаков типа (ISO 6346, приложение D) */
const TYPE_DETAILS: Record<string, string> = {
  G0: "универсальный, проёмы на одном или обоих торцах",
  G1: "универсальный, пассивная вентиляция в верхней части",
  G2: "универсальный, проёмы в торце и бортах",
  G3: "универсальный, проёмы в торце, бортах и крыше",
  V0: "вентилируемый, естественная вентиляция",
  V2: "вентилируемый, механическая система вентиляции",
  V4: "вентилируемый, механическая система внутри",
  B0: "насыпной закрытый",
  B1: "насыпной герметичный",
  B3: "насыпной с разгрузкой под давлением (горизонтальная)",
  B4: "насыпной с разгрузкой под давлением (опрокидыванием)",
  S0: "для перевозки скота",
  S1: "для перевозки автомобилей",
  S2: "для перевозки живой рыбы",
  R0: "рефрижератор с холодильной установкой",
  R1: "рефрижератор с холодильной установкой и обогревом",
  R2: "рефрижератор с собственным энергоснабжением",
  R3: "рефрижератор с обогревом и собственным энергоснабжением",
  H0: "изотермический, съёмное оборудование снаружи",
  H1: "изотермический, съёмное оборудование внутри",
  H2: "изолированный (без оборудования)",
  H5: "изолированный усиленный",
  H6: "с системой обогрева",
  U0: "open top, открывающиеся торцы",
  U1: "open top, съёмные верхние балки торцов",
  U2: "open top, проёмы в бортах",
  U3: "open top, проёмы в бортах и съёмные балки",
  U4: "open top, проём в борту с частичной крышей",
  U5: "open top, жёсткая открытая крыша",
  P0: "платформа без надстроек",
  P1: "флет с двумя неполными торцевыми стойками",
  P2: "флет с неподвижными полными торцевыми стенками",
  P3: "флет со складными неполными стойками",
  P4: "флет со складными полными торцевыми стенками",
  P5: "каркасный, открытые борта и торцы",
  T0: "танк для неопасных жидкостей, давление до 0.45 бар",
  T1: "танк для неопасных жидкостей, давление до 1.5 бар",
  T2: "танк для неопасных жидкостей, давление до 2.65 бар",
  T3: "танк для опасных жидкостей, давление до 1.5 бар",
  T4: "танк для опасных жидкостей, давление до 2.65 бар",
  T5: "танк для опасных жидкостей, давление до 4 бар",
  T6: "танк для опасных жидкостей, давление до 6 бар",
  T7: "газовый танк, давление до 9.1 бар",
  T8: "газовый танк, давление до 22 бар",
  T9: "газовый танк, давление свыше 22 бар",
};

/**
 * Посимвольная расшифровка size-type кода (4 знака, например "45G1"
 * или "L5G1"). Возвращает null, если строка не похожа на size-type.
 */
export function decodeIso6346SizeType(code: string): IContainerSizeType | null {
  const normalized = code.toUpperCase();

  if (normalized.length !== 4) {
    return null;
  }
  const length = SIZE_LENGTH[normalized[0]];
  const height = SIZE_HEIGHT[normalized[1]];
  const typeGroup = TYPE_GROUPS[normalized[2]];
  const typeCode = normalized.slice(2);

  if (!length || !height || !typeGroup) {
    return null;
  }

  return {
    code: normalized,
    lengthCode: normalized[0],
    length,
    heightCode: normalized[1],
    height,
    typeCode,
    typeGroup,
    typeDetail: TYPE_DETAILS[typeCode] ?? typeGroup,
  };
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
