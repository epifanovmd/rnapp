import React, { FC, memo } from "react";
import Svg, { Circle, Path } from "react-native-svg";

/**
 * Иконки панели ввода. ViewBox 24×24. Используются только те глифы,
 * которые нужны самой панели.
 */

export type InputIconName =
  | "arrow.up"
  | "chevron.left"
  | "chevron.up"
  | "lock.fill"
  | "mic.fill"
  | "paperclip"
  | "pencil"
  | "arrowshape.turn.up.left.fill"
  | "trash.fill"
  | "xmark";

interface IInputIconProps {
  name: InputIconName;
  size: number;
  color: string;
  strokeWidth?: number;
}

/**
 * Размер иконки — это размер шрифта символа, а не его бокса: глиф рисуется
 * примерно в 1.2 раза крупнее. Наши глифы, наоборот, занимают лишь ~3/4
 * viewBox 24×24, поэтому при том же числовом размере выглядят заметно мельче.
 * Коэффициент выравнивает оптический размер — единственная ручка, если иконки
 * покажутся крупными/мелкими.
 */
const SF_POINT_SIZE_SCALE = 1.5;

interface IGlyph {
  paths: { d: string; fill?: boolean; stroke?: boolean }[];
  circle?: { fill?: boolean };
}

const GLYPHS: Record<InputIconName, IGlyph> = {
  "arrow.up": {
    paths: [{ d: "M12 20V4M5.5 10.5L12 4l6.5 6.5", stroke: true }],
  },
  "chevron.left": { paths: [{ d: "M15 5l-7 7 7 7", stroke: true }] },
  "chevron.up": { paths: [{ d: "M5 15l7-7 7 7", stroke: true }] },
  "lock.fill": {
    paths: [
      { d: "M5.5 11h13v10h-13z", fill: true },
      { d: "M8 11V7.5a4 4 0 0 1 8 0V11", stroke: true },
    ],
  },
  "mic.fill": {
    paths: [
      { d: "M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z", fill: true },
      { d: "M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21", stroke: true },
    ],
  },
  paperclip: {
    paths: [
      {
        d: "M8 12.5l7-7a3.2 3.2 0 0 1 4.5 4.5l-8.2 8.2a5.2 5.2 0 0 1-7.3-7.3L11.5 3.4",
        stroke: true,
      },
    ],
  },
  pencil: {
    paths: [
      { d: "M4 20l1-4L16.5 4.5a2 2 0 0 1 3 3L8 19z", stroke: true },
      { d: "M14.5 6.5l3 3", stroke: true },
    ],
  },
  "arrowshape.turn.up.left.fill": {
    paths: [
      {
        d: "M11 5v4c5.5 0 9 3 10 8-2-2.5-4.5-3.8-10-3.8V17l-8-6z",
        fill: true,
      },
    ],
  },
  "trash.fill": {
    paths: [
      { d: "M5 7h14l-1.2 14H6.2z", fill: true },
      { d: "M4 7h16M9.5 7V4.5h5V7", stroke: true },
    ],
  },
  xmark: { paths: [{ d: "M6 6l12 12M18 6L6 18", stroke: true }] },
};

export const InputIcon: FC<IInputIconProps> = memo(
  ({ name, size, color, strokeWidth = 2 }) => {
    const glyph = GLYPHS[name];
    const innerColor = glyph.circle?.fill ? "#FFFFFF" : color;
    const box = size * SF_POINT_SIZE_SCALE;

    return (
      <Svg width={box} height={box} viewBox="0 0 24 24">
        {glyph.circle && (
          <Circle
            cx={12}
            cy={12}
            r={9}
            fill={glyph.circle.fill ? color : "none"}
            stroke={glyph.circle.fill ? "none" : color}
            strokeWidth={strokeWidth}
          />
        )}
        {glyph.paths.map((p, i) => (
          <Path
            key={i}
            d={p.d}
            fill={p.fill ? innerColor : "none"}
            stroke={p.stroke ? innerColor : "none"}
            strokeWidth={p.stroke ? strokeWidth : 0}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </Svg>
    );
  },
);

InputIcon.displayName = "InputIcon";
