import React, { FC, memo } from "react";
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

interface IGlyph {
  paths: string[];

  filledPaths?: string[];
}

const GLYPHS: Record<string, IGlyph> = {
  "arrowshape.turn.up.left": {
    paths: [
      "M8.2 4.2 L3 9.4 L8.2 14.6 L8.2 11.2 C12.6 11.2 15.2 12.8 16.8 15.8 C16.8 10 13.2 7.6 8.2 7.6 Z",
    ],
  },
  "arrowshape.turn.up.right": {
    paths: [
      "M11.8 4.2 L17 9.4 L11.8 14.6 L11.8 11.2 C7.4 11.2 4.8 12.8 3.2 15.8 C3.2 10 6.8 7.6 11.8 7.6 Z",
    ],
  },
  "doc.on.doc": {
    paths: [
      "M8.6 3 H13.1 L15.9 5.8 V12.4 C15.9 13 15.4 13.5 14.8 13.5 H8.6 C8 13.5 7.5 13 7.5 12.4 V4.1 C7.5 3.5 8 3 8.6 3 Z",
      "M7.5 6.5 H5.2 C4.6 6.5 4.1 7 4.1 7.6 V15.9 C4.1 16.5 4.6 17 5.2 17 H11.4 C12 17 12.5 16.5 12.5 15.9 V13.5",
    ],
  },
  trash: {
    paths: [
      "M4 5.7 H16",
      "M8 5.7 C8 3.9 12 3.9 12 5.7",
      "M5.4 5.7 L6.2 15.9 C6.27 16.7 6.93 17.3 7.73 17.3 H12.27 C13.07 17.3 13.73 16.7 13.8 15.9 L14.6 5.7",
      "M8.5 8.6 L8.8 14.4",
      "M11.5 8.6 L11.2 14.4",
    ],
  },
  pencil: {
    paths: [
      "M4 16 L4.7 13.2 L13.1 4.8 C13.9 4 15.2 4 16 4.8 C16.8 5.6 16.8 6.9 16 7.7 L7.6 16.1 L4 16 Z",
      "M12.2 5.7 L15.1 8.6",
    ],
  },
  "square.and.arrow.up": {
    paths: [
      "M6.5 8 H5.4 C4.8 8 4.3 8.5 4.3 9.1 V15.9 C4.3 16.5 4.8 17 5.4 17 H14.6 C15.2 17 15.7 16.5 15.7 15.9 V9.1 C15.7 8.5 15.2 8 14.6 8 H13.5",
      "M10 12.4 V3.2",
      "M7.2 5.8 L10 3 L12.8 5.8",
    ],
  },
  pin: {
    paths: [
      "M7.6 3.4 H12.4 L12 8.9 C13.5 9.7 14.4 11 14.6 12.5 H5.4 C5.6 11 6.5 9.7 8 8.9 Z",
      "M10 12.5 V17",
    ],
  },
  star: {
    paths: [
      "M10 3.4 L11.9 7.7 L16.6 8.1 L13 11.2 L14.1 15.8 L10 13.3 L5.9 15.8 L7 11.2 L3.4 8.1 L8.1 7.7 Z",
    ],
  },
  checkmark: {
    paths: ["M4.4 10.6 L8.4 14.6 L15.6 5.6"],
  },
};

const ICON_BOX = 20;
const STROKE_WIDTH = 1.4;

export interface ISfSymbolIconProps {
  name: string;
  color: string;
}

export const SfSymbolIcon: FC<ISfSymbolIconProps> = memo(({ name, color }) => {
  const glyph = GLYPHS[name];

  if (!glyph) {
    return <View style={{ width: ICON_BOX, height: ICON_BOX }} />;
  }

  return (
    <Svg
      width={ICON_BOX}
      height={ICON_BOX}
      viewBox={`0 0 ${ICON_BOX} ${ICON_BOX}`}
    >
      {glyph.paths.map(d => (
        <Path
          key={d}
          d={d}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ))}
      {glyph.filledPaths?.map(d => (
        <Path key={d} d={d} fill={color} />
      ))}
    </Svg>
  );
});
