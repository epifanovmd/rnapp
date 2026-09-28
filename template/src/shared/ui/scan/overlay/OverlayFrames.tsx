import { TScanOverlayBoxKind } from "@shared/lib/scan-overlay";
import { Path } from "@shopify/react-native-skia";
import React, { FC, memo } from "react";
import { useDerivedValue } from "react-native-reanimated";

import { buildBoxesPath, buildCornersPath } from "./frame-paths";
import { IScanOverlayApi } from "./ScanOverlayHost";

export interface IOverlayFramesProps {
  api: IScanOverlayApi;
  /** Категория боксов, которые рисует слой */
  kind: TScanOverlayBoxKind;
  color: string;
  /** corners — уголки-скобки (по умолчанию), box — скруглённая рамка */
  variant?: "corners" | "box";
  strokeWidth?: number;
  opacity?: number;
}

/** Слой рамок оверлея: один Skia-путь на категорию боксов */
export const OverlayFrames: FC<IOverlayFramesProps> = memo(
  ({ api, kind, color, variant = "corners", strokeWidth, opacity = 1 }) => {
    const path = useDerivedValue(
      () =>
        variant === "corners"
          ? buildCornersPath(api.boxes.value, kind)
          : buildBoxesPath(api.boxes.value, kind),
      [api.boxes, kind, variant],
    );

    return (
      <Path
        path={path}
        style={"stroke"}
        strokeWidth={strokeWidth ?? (variant === "corners" ? 3 : 1.5)}
        strokeCap={"round"}
        strokeJoin={"round"}
        color={color}
        opacity={opacity}
      />
    );
  },
);
