import type { OcrBufferOrientation } from "react-native-vision-engine";

import { toUprightRect } from "../orientation";
import { IOcrScanRect } from "../types";

const rect: IOcrScanRect = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };

describe("toUprightRect", () => {
  it.each<[OcrBufferOrientation, IOcrScanRect]>([
    ["up", { x: 0.1, y: 0.2, width: 0.3, height: 0.4 }],
    ["upMirrored", { x: 0.6, y: 0.2, width: 0.3, height: 0.4 }],
    ["down", { x: 0.6, y: 0.4, width: 0.3, height: 0.4 }],
    ["downMirrored", { x: 0.1, y: 0.4, width: 0.3, height: 0.4 }],
    ["left", { x: 0.4, y: 0.1, width: 0.4, height: 0.3 }],
    ["leftMirrored", { x: 0.2, y: 0.1, width: 0.4, height: 0.3 }],
    ["right", { x: 0.2, y: 0.6, width: 0.4, height: 0.3 }],
    ["rightMirrored", { x: 0.4, y: 0.6, width: 0.4, height: 0.3 }],
  ])("выпрямляет ориентацию %s", (orientation, expected) => {
    const upright = toUprightRect(rect, orientation);

    expect(upright.x).toBeCloseTo(expected.x, 10);
    expect(upright.y).toBeCloseTo(expected.y, 10);
    expect(upright.width).toBeCloseTo(expected.width, 10);
    expect(upright.height).toBeCloseTo(expected.height, 10);
  });

  it("оставляет результат внутри единичного квадрата для всех ориентаций", () => {
    const orientations: OcrBufferOrientation[] = [
      "up",
      "upMirrored",
      "down",
      "downMirrored",
      "left",
      "leftMirrored",
      "right",
      "rightMirrored",
    ];

    for (const orientation of orientations) {
      const upright = toUprightRect(rect, orientation);

      expect(upright.x).toBeGreaterThanOrEqual(0);
      expect(upright.y).toBeGreaterThanOrEqual(0);
      expect(upright.x + upright.width).toBeLessThanOrEqual(1);
      expect(upright.y + upright.height).toBeLessThanOrEqual(1);
    }
  });
});
