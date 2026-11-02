import React, { FC, memo, useMemo } from "react";
import Svg, { Path, Rect } from "react-native-svg";

import { createQrMatrix } from "./qr-matrix";

export interface IQrCodeProps {
  value: string;
  size?: number;
  /** Отступ «тихой зоны» в модулях. */
  quietZone?: number;
  color?: string;
  background?: string;
}

/** QR-код (SVG). Цвета по умолчанию контрастны в любой теме: чёрный на белом. */
export const QrCode: FC<IQrCodeProps> = memo(
  ({
    value,
    size = 240,
    quietZone = 2,
    color = "#000000",
    background = "#FFFFFF",
  }) => {
    const { path, dimension } = useMemo(() => {
      const matrix = createQrMatrix(value);
      const segments: string[] = [];

      matrix.forEach((row, y) =>
        row.forEach((dark, x) => {
          if (dark) {
            segments.push(`M${x + quietZone} ${y + quietZone}h1v1h-1z`);
          }
        }),
      );

      return {
        path: segments.join(""),
        dimension: matrix.length + quietZone * 2,
      };
    }, [value, quietZone]);

    return (
      <Svg width={size} height={size} viewBox={`0 0 ${dimension} ${dimension}`}>
        <Rect width={dimension} height={dimension} fill={background} />
        <Path d={path} fill={color} />
      </Svg>
    );
  },
);
