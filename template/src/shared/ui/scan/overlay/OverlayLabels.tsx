import { TScanOverlayBoxKind } from "@shared/lib/scan-overlay";
import { matchFont, Picture, Skia } from "@shopify/react-native-skia";
import React, { FC, memo, useMemo } from "react";
import { Platform } from "react-native";
import { useDerivedValue } from "react-native-reanimated";

import { IScanOverlayApi } from "./ScanOverlayHost";

const FONT_SIZE = 12;
const PLATE_PADDING_H = 6;
const PLATE_PADDING_V = 3;
const PLATE_GAP = 4;
const PLATE_RADIUS = 4;

export interface IOverlayLabelsProps {
  api: IScanOverlayApi;
  /** Категория боксов, чьи `label` подписываются */
  kind: TScanOverlayBoxKind;
  /** Цвет текста */
  color?: string;
  /** Цвет плашки под текстом */
  background?: string;
}

/**
 * Подписи над рамками: боксы категории с непустым `label` получают плашку
 * с текстом. Динамическое число подписей не выразить декларативным Skia —
 * слой записывает SkPicture в worklet'е и рендерит одним `<Picture>`.
 */
export const OverlayLabels: FC<IOverlayLabelsProps> = memo(
  ({ api, kind, color = "white", background = "rgba(0, 0, 0, 0.65)" }) => {
    const font = useMemo(
      () =>
        matchFont({
          fontFamily: Platform.select({
            ios: "Helvetica",
            default: "sans-serif",
          }),
          fontSize: FONT_SIZE,
          fontWeight: "600",
        }),
      [],
    );

    const picture = useDerivedValue(() => {
      const size = api.size.value;
      const recorder = Skia.PictureRecorder();
      const canvas = recorder.beginRecording(
        Skia.XYWHRect(0, 0, Math.max(size.width, 1), Math.max(size.height, 1)),
      );
      const boxes = api.boxes.value;
      const textPaint = Skia.Paint();
      const platePaint = Skia.Paint();

      textPaint.setColor(Skia.Color(color));
      platePaint.setColor(Skia.Color(background));

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];

        if (box.kind !== kind || box.label === undefined || box.label === "") {
          continue;
        }
        const textWidth = font.measureText(box.label).width;
        const plateWidth = textWidth + PLATE_PADDING_H * 2;
        const plateHeight = FONT_SIZE + PLATE_PADDING_V * 2;
        const x = Math.max(box.rect.x, 2);
        const y = Math.max(box.rect.y - plateHeight - PLATE_GAP, 2);

        canvas.drawRRect(
          Skia.RRectXY(
            Skia.XYWHRect(x, y, plateWidth, plateHeight),
            PLATE_RADIUS,
            PLATE_RADIUS,
          ),
          platePaint,
        );
        canvas.drawText(
          box.label,
          x + PLATE_PADDING_H,
          y + PLATE_PADDING_V + FONT_SIZE * 0.82,
          textPaint,
          font,
        );
      }

      return recorder.finishRecordingAsPicture();
    }, [api.boxes, api.size, kind, color, background, font]);

    return <Picture picture={picture} />;
  },
);
