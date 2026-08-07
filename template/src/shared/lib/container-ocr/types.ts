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

/** Расшифровка size-type кода (ISO 6346, необязательная строка под номером) */
export interface IContainerSizeType {
  code: string;
  /** Длина, например "40 футов" */
  length: string;
  /** Высота, например "9'6\" (high cube)" */
  height: string;
  /** Тип, например "универсальный (general purpose)" */
  type: string;
}
