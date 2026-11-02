import { IOcrScanRect } from "@shared/lib/ocr-scan";

/** Кандидат российского автономера, извлечённый из OCR-областей */
export interface IPlateCandidate {
  /**
   * Каноническое значение в латинице (как читает OCR),
   * например "A123BC77" или "A123BC777"
   */
  value: string;
  /** Формат и регион прошли валидацию */
  isValid: boolean;
  confidence: number;
  rect: IOcrScanRect;
}

/** Разобранный номер */
export interface IPlateParts {
  /** Буквы и цифры номера без региона, латиницей: "A123BC" */
  base: string;
  /** Код региона: "77", "750" */
  region: string;
}
