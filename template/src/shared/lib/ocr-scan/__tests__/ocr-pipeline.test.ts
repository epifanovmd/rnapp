import type {
  DetectedObject,
  FrameSession,
  OcrRoi,
  OcrRoiResult,
} from "react-native-vision-engine";

import { runOcrPipeline } from "../ocr-worklets";
import { buildOcrPipelineConfig } from "../pipeline-config";

const detection = (label: string, score: number): DetectedObject => ({
  classIndex: 0,
  label,
  score,
  rect: { x: 0.1, y: 0.1, width: 0.2, height: 0.1 },
});

/** Сессия-заглушка: детекции заданы, OCR возвращает подпись области по порядку */
const fakeSession = (
  detections: DetectedObject[],
  texts: string[][],
): FrameSession & { roiCalls: OcrRoi[][] } => {
  const roiCalls: OcrRoi[][] = [];

  return {
    width: 1920,
    height: 1080,
    roiCalls,
    detect: () => detections,
    recognize: (rois: OcrRoi[]): OcrRoiResult[] => {
      roiCalls.push(rois);

      return rois.map((_, index) => ({
        read: true,
        observations: (texts[roiCalls.length - 1]?.[index] ?? "")
          .split(",")
          .filter(value => value !== "")
          .map(value => ({
            text: value,
            confidence: 0.9,
            rect: { x: 0, y: 0, width: 0.1, height: 0.1 },
          })),
      }));
    },
  } as unknown as FrameSession & { roiCalls: OcrRoi[][] };
};

const detector = {
  model: { name: "detector" },
  regions: [{ label: "code" }, { label: "net", padding: 0.1 }],
};

describe("runOcrPipeline", () => {
  it("связывает текст с регионом по индексу запроса", () => {
    const session = fakeSession(
      [detection("plate", 0.99), detection("code", 0.9), detection("net", 0.8)],
      [["MSKU9070323", "26780 KG"]],
    );

    const frame = runOcrPipeline(session, buildOcrPipelineConfig(detector, {}));

    expect(frame.regions.map(item => item.label)).toEqual(["code", "net"]);
    expect(frame.regions[0].observations[0].text).toBe("MSKU9070323");
    expect(frame.regions[1].observations[0].text).toBe("26780 KG");
    expect(session.roiCalls[0].map(roi => roi.padding)).toEqual([0.18, 0.1]);
    expect(frame.fullFrame).toEqual([]);
  });

  it("без детектора читает полный кадр", () => {
    const session = fakeSession([], [["LINE"]]);

    const frame = runOcrPipeline(session, buildOcrPipelineConfig(null, {}));

    expect(frame.regions).toEqual([]);
    expect(frame.fullFrame.map(item => item.text)).toEqual(["LINE"]);
    expect(session.roiCalls[0][0].rect).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it("дочитывает полный кадр при fullFrameFallback, когда регионы пусты", () => {
    const session = fakeSession([detection("code", 0.9)], [[""], ["FULL"]]);

    const frame = runOcrPipeline(
      session,
      buildOcrPipelineConfig(detector, { fullFrameFallback: true }),
    );

    expect(frame.regions).toHaveLength(1);
    expect(frame.fullFrame.map(item => item.text)).toEqual(["FULL"]);
  });

  it("без fullFrameFallback полный кадр не читает", () => {
    const session = fakeSession([detection("code", 0.9)], [[""]]);

    runOcrPipeline(session, buildOcrPipelineConfig(detector, {}));

    expect(session.roiCalls).toHaveLength(1);
  });
});
