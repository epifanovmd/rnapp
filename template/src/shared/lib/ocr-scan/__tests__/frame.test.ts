import {
  collectCandidates,
  frameObservations,
  regionObservations,
} from "../frame";
import {
  IOcrScanCandidate,
  IOcrScanFrame,
  IOcrScanObservation,
  IOcrScanRegion,
} from "../types";

const text = (value: string): IOcrScanObservation => ({
  text: value,
  confidence: 0.9,
  rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
});

const region = (label: string, lines: string[]): IOcrScanRegion => ({
  label,
  classIndex: 0,
  score: 0.9,
  rect: { x: 0, y: 0, width: 0.5, height: 0.5 },
  read: true,
  observations: lines.map(text),
});

const frame = (
  regions: IOcrScanRegion[],
  fullFrame: string[] = [],
): IOcrScanFrame => ({
  regions,
  fullFrame: fullFrame.map(text),
  imageWidth: 1920,
  imageHeight: 1080,
});

/** Кандидат — склейка всех строк области: так видно, чьи строки смешались */
const joinAll = (observations: IOcrScanObservation[]): IOcrScanCandidate[] => [
  {
    value: observations.map(item => item.text).join(""),
    isValid: observations.length > 1,
    confidence: observations.length / 10,
    rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
  },
];

describe("collectCandidates", () => {
  it("не смешивает текст разных регионов одного класса", () => {
    const candidates = collectCandidates(
      frame([region("code", ["MSKU", "907"]), region("code", ["TGHU", "123"])]),
      "code",
      joinAll,
    );

    expect(candidates.map(item => item.value).sort()).toEqual([
      "MSKU907",
      "TGHU123",
    ]);
  });

  it("берёт только регионы заданного класса", () => {
    const candidates = collectCandidates(
      frame([region("code", ["A", "B"]), region("type", ["45G1"])]),
      "code",
      joinAll,
    );

    expect(candidates.map(item => item.value)).toEqual(["AB"]);
  });

  it("без регионов читает полный кадр", () => {
    const candidates = collectCandidates(
      frame([], ["X", "Y"]),
      "code",
      joinAll,
    );

    expect(candidates.map(item => item.value)).toEqual(["XY"]);
  });

  it("сливает одинаковые значения и ставит валидные первыми", () => {
    const candidates = collectCandidates(
      frame([region("a", ["Z"]), region("b", ["P", "Q"]), region("c", ["Z"])]),
      null,
      joinAll,
    );

    expect(candidates.map(item => item.value)).toEqual(["PQ", "Z"]);
  });
});

describe("regionObservations / frameObservations", () => {
  const sample = frame(
    [region("code", ["A"]), region("type", ["B"]), region("code", ["C"])],
    ["D"],
  );

  it("собирает текст регионов класса", () => {
    expect(regionObservations(sample, "code").map(item => item.text)).toEqual([
      "A",
      "C",
    ]);
  });

  it("собирает весь текст кадра", () => {
    expect(frameObservations(sample).map(item => item.text)).toEqual([
      "A",
      "B",
      "C",
      "D",
    ]);
  });
});
