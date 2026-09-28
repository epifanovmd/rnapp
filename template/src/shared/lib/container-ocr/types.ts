/** Нормализованный [0..1] прямоугольник выпрямленного кадра, top-left origin */
export interface IContainerRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Разобранный код ISO 6346 */
export interface IContainerCodeParts {
  /** Код владельца (3 буквы), например "MSC" */
  owner: string;
  /** Категория оборудования: U — контейнер, J — съёмное оборудование, Z — шасси */
  category: string;
  /** Серийный номер (6 цифр) */
  serial: string;
  /** Контрольная цифра */
  checkDigit: number;
}

/** Кандидат кода контейнера, извлечённый из OCR-областей кадра */
export interface IContainerCandidate {
  /** Полный код из 11 символов, например "MSCU1234567" */
  code: string;
  /** Контрольная цифра сошлась */
  isValid: boolean;
  /** Минимальная уверенность исходных OCR-областей [0..1] */
  confidence: number;
  rect: IContainerRect;
}

/** Посимвольная расшифровка size-type кода (ISO 6346) */
export interface IContainerSizeType {
  code: string;
  /** Первый знак кода ("4") */
  lengthCode: string;
  /** Длина, например "40 футов (12 192 мм)" */
  length: string;
  /** Второй знак кода ("5") */
  heightCode: string;
  /** Высота и ширина, например "9'6\" (2896 мм) — high cube" */
  height: string;
  /** Пара знаков типа ("G1") */
  typeCode: string;
  /** Группа типа по букве, например "универсальный (general purpose)" */
  typeGroup: string;
  /** Точный тип по паре знаков; при неизвестной паре — группа */
  typeDetail: string;
}
