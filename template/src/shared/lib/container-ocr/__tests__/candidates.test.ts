import type { OcrObservation } from "react-native-vision-engine";

import { extractContainerCandidates } from "../candidates";

function observation(
  text: string,
  rect = { x: 0.1, y: 0.1, width: 0.3, height: 0.05 },
): OcrObservation {
  return { text, confidence: 0.9, rect, fromDetector: false };
}

describe("extractContainerCandidates", () => {
  it("извлекает валидный код из одной области", () => {
    const candidates = extractContainerCandidates([
      observation("MSKU 907032 3"),
    ]);

    expect(candidates[0]).toMatchObject({
      code: "MSKU9070323",
      isValid: true,
    });
  });

  it("исправляет OCR-путаницу «цифра вместо буквы» в префиксе владельца", () => {
    // «5» на второй позиции читается как S
    const candidates = extractContainerCandidates([
      observation("M5KU 907032 3"),
    ]);

    expect(candidates.some(c => c.code === "MSKU9070323" && c.isValid)).toBe(
      true,
    );
  });

  it("исправляет OCR-путаницу «буква вместо цифры» в серийной части", () => {
    // «O» в серийнике читается как 0
    const candidates = extractContainerCandidates([
      observation("MSKU 9O7O32 3"),
    ]);

    expect(candidates.some(c => c.code === "MSKU9070323" && c.isValid)).toBe(
      true,
    );
  });

  it("отдаёт кандидата с несошедшейся контрольной цифрой как невалидного", () => {
    const candidates = extractContainerCandidates([
      observation("MSKU 907032 9"),
    ]);

    expect(candidates.some(c => c.code === "MSKU9070329")).toBe(true);
    expect(candidates.every(c => !c.isValid)).toBe(true);
  });

  it("склеивает код из пары соседних областей", () => {
    const candidates = extractContainerCandidates([
      observation("MSKU", { x: 0.1, y: 0.5, width: 0.1, height: 0.05 }),
      observation("907032 3", { x: 0.21, y: 0.5, width: 0.15, height: 0.05 }),
    ]);

    expect(candidates.some(c => c.code === "MSKU9070323" && c.isValid)).toBe(
      true,
    );
  });

  it("не склеивает далёкие области", () => {
    const candidates = extractContainerCandidates([
      observation("MSKU", { x: 0.05, y: 0.1, width: 0.1, height: 0.05 }),
      observation("907032 3", { x: 0.8, y: 0.9, width: 0.15, height: 0.05 }),
    ]);

    expect(candidates).toHaveLength(0);
  });

  it("валидные кандидаты идут раньше невалидных", () => {
    const candidates = extractContainerCandidates([
      observation("TCKU 305438 9"),
      observation("MSKU 907032 3", {
        x: 0.5,
        y: 0.7,
        width: 0.3,
        height: 0.05,
      }),
    ]);

    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0].isValid).toBe(true);
    expect(candidates[0].code).toBe("MSKU9070323");
  });
});
