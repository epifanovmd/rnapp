import {
  decodeIso6346SizeType,
  formatContainerCode,
  IContainerAttributes,
  IContainerCandidate,
  parseIso6346,
  resolveOwnerName,
} from "@shared/lib/container-ocr";

import { IContainerScanResult } from "./types";

/** Кандидат + атрибуты → результат сканирования; null — код не разобрался */
export function buildScanResult(
  candidate: IContainerCandidate,
  attributes: IContainerAttributes,
): IContainerScanResult | null {
  const parts = parseIso6346(candidate.code);

  if (parts === null) {
    return null;
  }

  return {
    candidate,
    parts,
    ownerName: resolveOwnerName(parts.owner),
    formatted: formatContainerCode(candidate.code),
    attributes,
    sizeType:
      attributes.sizeTypeCode === null
        ? null
        : decodeIso6346SizeType(attributes.sizeTypeCode),
  };
}
