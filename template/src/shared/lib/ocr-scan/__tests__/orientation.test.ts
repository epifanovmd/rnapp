import type { CameraOrientation } from "react-native-vision-camera";
import type { OcrBufferOrientation } from "react-native-vision-engine";

import {
  previewOrientationDelta,
  swapsFrameSides,
  toPreviewRect,
  toUprightRect,
} from "../orientation";
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

describe("previewOrientationDelta", () => {
  it.each<[CameraOrientation, CameraOrientation, CameraOrientation]>([
    ["up", "up", "up"],
    ["right", "up", "right"],
    ["left", "up", "left"],
    ["down", "up", "down"],
    // интерфейс повёрнут вместе с телефоном — доворота нет
    ["right", "right", "up"],
    ["left", "left", "up"],
    ["up", "right", "left"],
    ["up", "left", "right"],
  ])(
    "устройство %s при интерфейсе %s даёт доворот %s",
    (device, interfaceOrientation, expected) => {
      expect(previewOrientationDelta(device, interfaceOrientation)).toBe(
        expected,
      );
    },
  );
});

describe("toPreviewRect", () => {
  it("оставляет координаты кадра как есть без доворота", () => {
    expect(toPreviewRect(rect, "up")).toEqual(rect);
  });

  it("доворачивает противоположные ориентации обратно к исходной", () => {
    const rotated = toPreviewRect(rect, "right");
    const restored = toPreviewRect(rotated, "left");

    expect(restored.x).toBeCloseTo(rect.x, 10);
    expect(restored.y).toBeCloseTo(rect.y, 10);
    expect(restored.width).toBeCloseTo(rect.width, 10);
    expect(restored.height).toBeCloseTo(rect.height, 10);
  });

  it("телефон повёрнут вправо — верх кадра уходит влево на превью", () => {
    // узкая полоса у верхней кромки выпрямленного кадра
    const topStrip: IOcrScanRect = { x: 0.2, y: 0, width: 0.6, height: 0.1 };
    const preview = toPreviewRect(topStrip, "right");

    expect(preview.x).toBeCloseTo(0, 10);
    expect(preview.width).toBeCloseTo(0.1, 10);
    expect(preview.y).toBeCloseTo(0.2, 10);
    expect(preview.height).toBeCloseTo(0.6, 10);
  });

  it("телефон повёрнут влево — верх кадра уходит вправо на превью", () => {
    const topStrip: IOcrScanRect = { x: 0.2, y: 0, width: 0.6, height: 0.1 };
    const preview = toPreviewRect(topStrip, "left");

    expect(preview.x).toBeCloseTo(0.9, 10);
    expect(preview.width).toBeCloseTo(0.1, 10);
    expect(preview.y).toBeCloseTo(0.2, 10);
    expect(preview.height).toBeCloseTo(0.6, 10);
  });
});

describe("swapsFrameSides", () => {
  it.each<[CameraOrientation, boolean]>([
    ["up", false],
    ["down", false],
    ["left", true],
    ["right", true],
  ])("для %s возвращает %s", (orientation, expected) => {
    expect(swapsFrameSides(orientation)).toBe(expected);
  });
});
