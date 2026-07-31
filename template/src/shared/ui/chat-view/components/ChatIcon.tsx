import React, { FC, memo } from "react";
import Svg, { Circle, Path } from "react-native-svg";

/**
 * Векторные аналоги SF Symbols, используемых нативным IOSChatView.
 * ViewBox 24×24, штриховые контуры со скруглёнными концами.
 */

export type ChatIconName =
  | "checkmark"
  | "checkmark.circle"
  | "checkmark.circle.fill"
  | "clock"
  | "chevron.down"
  | "chevron.up"
  | "chevron.left"
  | "chevron.right"
  | "play.fill"
  | "pause.fill"
  | "play.circle.fill"
  | "arrow.clockwise"
  | "doc.fill"
  | "doc.richtext.fill"
  | "doc.zipper"
  | "music.note"
  | "film"
  | "bubble.left.and.bubble.right"
  | "paperclip"
  | "mic.fill"
  | "arrow.up"
  | "trash.fill"
  | "xmark"
  | "lock.fill"
  | "pencil"
  | "arrowshape.turn.up.left.fill";

interface IChatIconProps {
  name: ChatIconName;
  size: number;
  color: string;
  strokeWidth?: number;
}

interface IGlyph {
  paths: { d: string; fill?: boolean; stroke?: boolean }[];
  circle?: { fill?: boolean };
}

const GLYPHS: Record<ChatIconName, IGlyph> = {
  checkmark: { paths: [{ d: "M4.5 12.5l5 5L19.5 6.5", stroke: true }] },
  "checkmark.circle": {
    circle: {},
    paths: [{ d: "M8 12.2l2.8 2.8L16.5 9", stroke: true }],
  },
  "checkmark.circle.fill": {
    circle: { fill: true },
    paths: [{ d: "M8 12.2l2.8 2.8L16.5 9", stroke: true }],
  },
  clock: {
    circle: {},
    paths: [{ d: "M12 7v5.2l3.4 2", stroke: true }],
  },
  "chevron.down": { paths: [{ d: "M5 9l7 7 7-7", stroke: true }] },
  "chevron.up": { paths: [{ d: "M5 15l7-7 7 7", stroke: true }] },
  "chevron.left": { paths: [{ d: "M15 5l-7 7 7 7", stroke: true }] },
  "chevron.right": { paths: [{ d: "M9 5l7 7-7 7", stroke: true }] },
  "play.fill": { paths: [{ d: "M8 5.5v13l11-6.5z", fill: true }] },
  "pause.fill": {
    paths: [
      { d: "M7 5h3.4v14H7z", fill: true },
      { d: "M13.6 5H17v14h-3.4z", fill: true },
    ],
  },
  "play.circle.fill": {
    circle: { fill: true },
    paths: [{ d: "M10 8.2v7.6l6-3.8z", fill: true }],
  },
  "arrow.clockwise": {
    paths: [
      { d: "M19 12a7 7 0 1 1-2.05-4.95", stroke: true },
      { d: "M17.4 3.6v3.6H13.8", stroke: true },
    ],
  },
  "doc.fill": {
    paths: [
      { d: "M6 3h8l4 4v14H6z", fill: true },
      { d: "M14 3v4h4", stroke: true },
    ],
  },
  "doc.richtext.fill": {
    paths: [
      { d: "M6 3h8l4 4v14H6z", fill: true },
      { d: "M9 12h6M9 15h6M9 18h4", stroke: true },
    ],
  },
  "doc.zipper": {
    paths: [
      { d: "M6 3h8l4 4v14H6z", fill: true },
      { d: "M12 4v3m0 2v2m0 2v2", stroke: true },
    ],
  },
  "music.note": {
    paths: [
      { d: "M10 18.5V5l9-2v13.5", stroke: true },
      { d: "M10 18.5a2.5 2 0 1 1-5 0 2.5 2 0 0 1 5 0z", fill: true },
      { d: "M19 16.5a2.5 2 0 1 1-5 0 2.5 2 0 0 1 5 0z", fill: true },
    ],
  },
  film: {
    paths: [
      { d: "M4 5h16v14H4z", stroke: true },
      {
        d: "M7.5 5v14M16.5 5v14M4 9.5h3.5M4 14.5h3.5M16.5 9.5H20M16.5 14.5H20",
        stroke: true,
      },
    ],
  },
  "bubble.left.and.bubble.right": {
    paths: [
      {
        d: "M3 6.5A2.5 2.5 0 0 1 5.5 4h6A2.5 2.5 0 0 1 14 6.5v3a2.5 2.5 0 0 1-2.5 2.5H8l-3 2.5V12A2.5 2.5 0 0 1 3 9.5z",
        stroke: true,
      },
      {
        d: "M16 9h2.5A2.5 2.5 0 0 1 21 11.5v3a2.5 2.5 0 0 1-2.5 2.5H18v2.5L15 17h-1.5",
        stroke: true,
      },
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
  "mic.fill": {
    paths: [
      { d: "M9 5a3 3 0 0 1 6 0v6a3 3 0 0 1-6 0z", fill: true },
      { d: "M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21", stroke: true },
    ],
  },
  "arrow.up": {
    paths: [{ d: "M12 20V4M5.5 10.5L12 4l6.5 6.5", stroke: true }],
  },
  "trash.fill": {
    paths: [
      { d: "M5 7h14l-1.2 14H6.2z", fill: true },
      { d: "M4 7h16M9.5 7V4.5h5V7", stroke: true },
    ],
  },
  xmark: { paths: [{ d: "M6 6l12 12M18 6L6 18", stroke: true }] },
  "lock.fill": {
    paths: [
      { d: "M5.5 11h13v10h-13z", fill: true },
      { d: "M8 11V7.5a4 4 0 0 1 8 0V11", stroke: true },
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
};

export const ChatIcon: FC<IChatIconProps> = memo(
  ({ name, size, color, strokeWidth = 2 }) => {
    const glyph = GLYPHS[name];
    const innerColor = glyph.circle?.fill ? "#FFFFFF" : color;

    return (
      <Svg width={size} height={size} viewBox="0 0 24 24">
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

ChatIcon.displayName = "ChatIcon";
