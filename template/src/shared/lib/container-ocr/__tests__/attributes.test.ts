import type { OcrObservation } from "react-native-vision-engine";

import {
  accumulateContainerCandidates,
  extractContainerAttributes,
  IContainerAttributeSources,
  mergeContainerAttributes,
} from "../attributes";

let nextLine = 0;

/** Область-строка: каждая следующая ниже предыдущей — строки не склеиваются */
const line = (text: string): OcrObservation => {
  const y = 0.1 + nextLine++ * 0.1;

  return {
    text,
    confidence: 0.9,
    rect: { x: 0.1, y, width: 0.4, height: 0.05 },
  };
};

/** Источники атрибутов: не заданные поля — пустые */
const sources = (
  partial: Partial<IContainerAttributeSources>,
): IContainerAttributeSources => ({
  sizeType: [],
  weightPlate: [],
  maxGross: [],
  tare: [],
  net: [],
  ...partial,
});

beforeEach(() => {
  nextLine = 0;
});

describe("extractContainerAttributes: типоразмер", () => {
  it("читает типоразмер из области своего региона", () => {
    const attributes = extractContainerAttributes(
      sources({ sizeType: [line("45G1")] }),
    );

    expect(attributes.sizeTypeCode).toBe("45G1");
  });

  it("исправляет букву вместо цифры в последнем знаке типоразмера", () => {
    const attributes = extractContainerAttributes(
      sources({ sizeType: [line("45GI")] }),
    );

    expect(attributes.sizeTypeCode).toBe("45G1");
  });
});

describe("extractContainerAttributes: табличка весов целиком", () => {
  it("читает веса по меткам таблички", () => {
    const attributes = extractContainerAttributes(
      sources({
        weightPlate: [
          line("MAX GROSS 30.480 KG"),
          line("TARE 3.700 KG"),
          line("NET 26.780 KG"),
          line("CU CAP 76.4 CU.M"),
        ],
      }),
    );

    expect(attributes.weights).toEqual({
      maxGrossKg: 30480,
      tareKg: 3700,
      netKg: 26780,
      cubicCapacityM3: 76.4,
    });
  });

  it("распределяет веса без меток по тождеству брутто = тара + нетто", () => {
    const attributes = extractContainerAttributes(
      sources({
        weightPlate: [line("30480"), line("3700"), line("26780")],
      }),
    );

    expect(attributes.weights).toMatchObject({
      maxGrossKg: 30480,
      tareKg: 3700,
      netKg: 26780,
    });
  });

  it("предпочитает килограммовую тройку фунтовой", () => {
    const attributes = extractContainerAttributes(
      sources({
        weightPlate: [line("30480 3700 26780"), line("67200 8158 59042")],
      }),
    );

    expect(attributes.weights.maxGrossKg).toBe(30480);
  });

  it("добирает нетто вычитанием, когда прочитаны только брутто и тара", () => {
    const attributes = extractContainerAttributes(
      sources({
        weightPlate: [line("MAX GROSS 30.480 KG"), line("TARE 3.700 KG")],
      }),
    );

    expect(attributes.weights.netKg).toBe(26780);
  });

  it("не принимает числа вне диапазона весов контейнера", () => {
    const attributes = extractContainerAttributes(
      sources({
        weightPlate: [line("2024"), line("11"), line("2013")],
      }),
    );

    expect(attributes.weights.maxGrossKg).toBeNull();
  });
});

describe("extractContainerAttributes: регионы отдельных весов", () => {
  it("значение поля определяется регионом, а не подписью", () => {
    const attributes = extractContainerAttributes(
      sources({
        maxGross: [line("30,480 KGS 67,200 LBS")],
        tare: [line("3,700 KGS 8,160 LBS")],
        net: [line("26,780 KGS 59,040 LBS")],
      }),
    );

    expect(attributes.weights).toMatchObject({
      maxGrossKg: 30480,
      tareKg: 3700,
      netKg: 26780,
    });
  });

  it("без единиц берёт меньшее правдоподобное число — килограммы", () => {
    const attributes = extractContainerAttributes(
      sources({ tare: [line("TARE"), line("8160"), line("3700")] }),
    );

    expect(attributes.weights.tareKg).toBe(3700);
  });

  it("читает число, разбитое OCR на соседние области строки", () => {
    const attributes = extractContainerAttributes(
      sources({
        maxGross: [
          {
            ...line("MAX GROSS"),
            rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.05 },
          },
          {
            ...line("30.480 KG"),
            rect: { x: 0.4, y: 0.1, width: 0.2, height: 0.05 },
          },
        ],
      }),
    );

    expect(attributes.weights.maxGrossKg).toBe(30480);
  });

  it("добирает нетто вычитанием из прочитанных полей", () => {
    const attributes = extractContainerAttributes(
      sources({
        maxGross: [line("30480 KG")],
        tare: [line("3700 KG")],
      }),
    );

    expect(attributes.weights.netKg).toBe(26780);
  });

  it("поле региона приоритетнее разбора таблички, пропуски добирает табличка", () => {
    const attributes = extractContainerAttributes(
      sources({
        tare: [line("3,750 KG")],
        weightPlate: [
          line("MAX GROSS 30.480 KG"),
          line("TARE 3.700 KG"),
          line("CU CAP 76.4 CU.M"),
        ],
      }),
    );

    expect(attributes.weights).toEqual({
      maxGrossKg: 30480,
      tareKg: 3750,
      netKg: 26730,
      cubicCapacityM3: 76.4,
    });
  });

  it("игнорирует поле без правдоподобного веса", () => {
    const attributes = extractContainerAttributes(
      sources({ net: [line("NET"), line("12")] }),
    );

    expect(attributes.weights.netKg).toBeNull();
  });
});

describe("mergeContainerAttributes", () => {
  it("накапливает типоразмер между кадрами", () => {
    const empty = extractContainerAttributes(sources({}));
    const withSizeType = extractContainerAttributes(
      sources({ sizeType: [line("45G1")] }),
    );

    const merged = mergeContainerAttributes(
      mergeContainerAttributes(empty, withSizeType),
      empty,
    );

    expect(merged.sizeTypeCode).toBe("45G1");
  });

  it("считает кадры только после того, как код набрал голоса", () => {
    const empty = extractContainerAttributes(sources({}));
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
