import {
  IContainerAttributes,
  IContainerCandidate,
  IContainerCodeParts,
  IContainerSizeType,
} from "@shared/lib/container-ocr";

/** Подтверждённый стабилизацией результат сканирования */
export interface IContainerScanResult {
  candidate: IContainerCandidate;
  parts: IContainerCodeParts;
  /** Имя судоходной линии, если код владельца известен */
  ownerName: string | null;
  /** Код в формате отображения: "MSCU 123456-7" */
  formatted: string;
  /** Тип и веса, накопленные за сессию сканирования */
  attributes: IContainerAttributes;
  /** Расшифровка size-type кода; null — код не распознан */
  sizeType: IContainerSizeType | null;
}
