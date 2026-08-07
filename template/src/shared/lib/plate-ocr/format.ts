import { IPlateParts } from "./types";

/** Латинские буквы OCR → кириллица ГОСТ для отображения */
const TO_CYRILLIC: Record<string, string> = {
  A: "А",
  B: "В",
  E: "Е",
  K: "К",
  M: "М",
  H: "Н",
  O: "О",
  P: "Р",
  C: "С",
  T: "Т",
  Y: "У",
  X: "Х",
};

/** Разбор канонического значения "A123BC77" на части; null — формат не совпал */
export function parsePlate(value: string): IPlateParts | null {
  if (value.length < 8 || value.length > 9) {
    return null;
  }

  return {
    base: value.slice(0, 6),
    region: value.slice(6),
  };
}

/** "A123BC77" → "А 123 ВС 77" (кириллица, как на знаке) */
export function formatPlate(value: string): string {
  const parts = parsePlate(value);

  if (parts === null) {
    return value;
  }
  let base = "";

  for (let i = 0; i < parts.base.length; i++) {
    const char = parts.base[i];

    base += TO_CYRILLIC[char] ?? char;
  }

  return `${base.slice(0, 1)} ${base.slice(1, 4)} ${base.slice(4, 6)} ${parts.region}`;
}
