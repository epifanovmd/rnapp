import type { DetectedObject } from "react-native-vision-engine";

import { selectObjects } from "../select-objects";

const object = (label: string, score: number): DetectedObject => ({
  classIndex: 0,
  label,
  score,
  rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
});

describe("selectObjects", () => {
  const objects = [
    object("car", 0.9),
    object("person", 0.8),
    object("car", 0.7),
  ];

  it("без фильтра классов режет по лимиту", () => {
    expect(
      selectObjects(objects, undefined, 2).map(item => item.score),
    ).toEqual([0.9, 0.8]);
  });

  it("оставляет только заданные классы до лимита", () => {
    expect(selectObjects(objects, ["car"], 5).map(item => item.score)).toEqual([
      0.9, 0.7,
    ]);
  });
});
