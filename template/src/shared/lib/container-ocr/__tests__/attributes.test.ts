import type { OcrObservation } from "react-native-vision-engine";

import {
  accumulateContainerCandidates,
  extractContainerAttributes,
  mergeContainerAttributes,
} from "../attributes";

let nextLine = 0;

/** Область-строка: каждая следующая ниже предыдущей — строки не склеиваются */
function line(text: string): OcrObservation {
  const y = 0.1 + nextLine++ * 0.1;

  return {
    text,
    confidence: 0.9,
    rect: { x: 0.1, y, width: 0.4, height: 0.05 },
    fromDetector: true,
    regionClassIndex: 2,
  };
}

beforeEach(() => {
  nextLine = 0;
});

describe("extractContainerAttributes", () => {
  it("читает типоразмер из области своего региона", () => {
    const attributes = extractContainerAttributes({
      sizeType: [line("45G1")],
      weights: [],
    });

    expect(attributes.sizeTypeCode).toBe("45G1");
  });

  it("исправляет букву вместо цифры в последнем знаке типоразмера", () => {
    const attributes = extractContainerAttributes({
      sizeType: [line("45GI")],
      weights: [],
    });

    expect(attributes.sizeTypeCode).toBe("45G1");
  });

  it("читает веса по меткам таблички", () => {
    const attributes = extractContainerAttributes({
      sizeType: [],
      weights: [
        line("MAX GROSS 30.480 KG"),
        line("TARE 3.700 KG"),
        line("NET 26.780 KG"),
        line("CU CAP 76.4 CU.M"),
      ],
    });

    expect(attributes.weights).toEqual({
      maxGrossKg: 30480,
      tareKg: 3700,
      netKg: 26780,
      cubicCapacityM3: 76.4,
    });
  });

  it("распределяет веса без меток по тождеству брутто = тара + нетто", () => {
    const attributes = extractContainerAttributes({
      sizeType: [],
      weights: [line("30480"), line("3700"), line("26780")],
    });

    expect(attributes.weights).toMatchObject({
      maxGrossKg: 30480,
      tareKg: 3700,
      netKg: 26780,
    });
  });

  it("предпочитает килограммовую тройку фунтовой", () => {
    const attributes = extractContainerAttributes({
      sizeType: [],
      weights: [line("30480 3700 26780"), line("67200 8158 59042")],
    });

    expect(attributes.weights.maxGrossKg).toBe(30480);
  });

  it("добирает нетто вычитанием, когда прочитаны только брутто и тара", () => {
    const attributes = extractContainerAttributes({
      sizeType: [],
      weights: [line("MAX GROSS 30.480 KG"), line("TARE 3.700 KG")],
    });

    expect(attributes.weights.netKg).toBe(26780);
  });

  it("не принимает числа вне диапазона весов контейнера", () => {
    const attributes = extractContainerAttributes({
      sizeType: [],
      weights: [line("2024"), line("11"), line("2013")],
    });

    expect(attributes.weights.maxGrossKg).toBeNull();
  });
});

describe("mergeContainerAttributes", () => {
  it("накапливает типоразмер между кадрами", () => {
    const empty = extractContainerAttributes({ sizeType: [], weights: [] });
    const withSizeType = extractContainerAttributes({
      sizeType: [line("45G1")],
      weights: [],
    });

    const merged = mergeContainerAttributes(
      mergeContainerAttributes(empty, withSizeType),
      empty,
    );

    expect(merged.sizeTypeCode).toBe("45G1");
  });

  it("считает кадры только после того, как код набрал голоса", () => {
    const empty = extractContainerAttributes({ sizeType: [], weights: [] });
    const candidate = {
      value: "MSKU9070323",
      isValid: true,
      confidence: 0.9,
      rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
    };

    // без подтверждённого кода счётчик стоит
    expect(mergeContainerAttributes(empty, empty).framesSinceCode).toBe(0);

    let attributes = empty;

    for (let i = 0; i < 3; i++) {
      attributes = accumulateContainerCandidates(attributes, [candidate]);
    }
    const first = mergeContainerAttributes(attributes, empty);

    expect(first.framesSinceCode).toBe(1);
    expect(mergeContainerAttributes(first, empty).framesSinceCode).toBe(2);
  });
});
