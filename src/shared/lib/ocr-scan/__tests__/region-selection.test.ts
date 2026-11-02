import type { DetectedObject } from "react-native-vision-engine";

import {
  decodeThreshold,
  IRegionLimits,
  selectRegions,
} from "../region-selection";

const limits: IRegionLimits = {
  minScore: 0.35,
  maxRegions: 6,
  maxPerClass: 2,
  padding: 0.18,
};

const detection = (
  label: string,
  score: number,
  classIndex = 0,
): DetectedObject => ({
  classIndex,
  label,
  score,
  rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
});

describe("selectRegions", () => {
  it("без правил читает все классы с квотой на класс", () => {
    const selected = selectRegions(
      [
        detection("a", 0.9),
        detection("b", 0.8),
        detection("a", 0.7),
        detection("a", 0.6),
      ],
      null,
      limits,
    );

    expect(selected.map(item => item.detection.label)).toEqual(["a", "b", "a"]);
  });

  it("с правилами читает только их классы с их настройками", () => {
    const selected = selectRegions(
      [
        detection("plate", 0.95),
        detection("code", 0.9),
        detection("code", 0.85),
        detection("net", 0.25),
      ],
      [
        { label: "code", maxCount: 1, padding: 0.1 },
        { label: "net", minScore: 0.2 },
      ],
      limits,
    );

    expect(selected.map(item => item.detection.label)).toEqual(["code", "net"]);
    expect(selected.map(item => item.padding)).toEqual([0.1, 0.18]);
  });

  it("соблюдает общий лимит", () => {
    const selected = selectRegions(
      [detection("a", 0.9), detection("b", 0.8), detection("c", 0.7)],
      null,
      { ...limits, maxRegions: 2 },
    );

    expect(selected).toHaveLength(2);
  });

  it("классы без имени различает по индексу", () => {
    const selected = selectRegions(
      [detection("", 0.9, 0), detection("", 0.8, 1), detection("", 0.7, 0)],
      null,
      { ...limits, maxPerClass: 1 },
    );

    expect(selected.map(item => item.detection.classIndex)).toEqual([0, 1]);
  });
});

describe("decodeThreshold", () => {
  it("учитывает самое мягкое правило", () => {
    expect(decodeThreshold([{ label: "net", minScore: 0.2 }], limits)).toBe(
      0.2,
    );
    expect(decodeThreshold(null, limits)).toBe(0.35);
  });
});
