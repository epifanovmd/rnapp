import { TScanOverlayBoxKind } from "@shared/lib/scan-overlay";
import { Path, Skia } from "@shopify/react-native-skia";
import React, { FC, memo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { IScanOverlayApi } from "./ScanOverlayHost";

export interface IOverlayDimProps {
  api: IScanOverlayApi;
  /** Категория боксов, вне которых затемняется фон */
  kind: TScanOverlayBoxKind;
  /** Плотность затемнения [0..1] */
  amount?: number;
  color?: string;
  /** Радиус скругления «окон» */
  radius?: number;
  /** Расширение «окон» вокруг боксов, px */
  padding?: number;
}

/**
 * Затемнение вне боксов категории: заливка канваса с «окнами» по боксам
 * (even-odd). Пока боксов нет — затемнение не рисуется.
 */
export const OverlayDim: FC<IOverlayDimProps> = memo(
  ({ api, kind, amount = 0.45, color = "black", radius = 8, padding = 6 }) => {
    const path = useDerivedValue(() => {
      const builder = Skia.PathBuilder.Make();
      const boxes = api.boxes.value;
      let holes = 0;

      for (let i = 0; i < boxes.length; i++) {
        const box = boxes[i];

        if (box.kind !== kind) {
          continue;
        }
        builder.addRRect(
          Skia.RRectXY(
            Skia.XYWHRect(
              box.rect.x - padding,
              box.rect.y - padding,
              box.rect.width + padding * 2,
              box.rect.height + padding * 2,
            ),
            radius,
            radius,
          ),
        );
        holes++;
      }

      if (holes > 0) {
        const size = api.size.value;

        builder.addRect(Skia.XYWHRect(0, 0, size.width, size.height));
      }

      return builder.detach();
    }, [api.boxes, api.size, kind, padding, radius]);

    return (
      <Path
        path={path}
        style={"fill"}
        fillType={"evenOdd"}
        color={color}
        opacity={amount}
      />
    );
  },
);
