import React, { FC } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import type { TTabBarIndicator } from "./tab-bar.types";
import { indicatorSpan, tabFrames } from "./tab-bar-geometry";

/** Отступ подложки внутри вкладки, px. */
const PILL_INSET = 2;
const DOT_SIZE = 5;
const LINE_WIDTH = 22;
const LINE_HEIGHT = 3;

interface ITabBarIndicatorProps {
  type: Exclude<TTabBarIndicator, "none">;
  /** Положение выбора (раскладка вкладок). */
  position: SharedValue<number>;
  /** Левый и правый края подложки (у «червяка» — с задержкой друг от друга). */
  start: SharedValue<number>;
  end: SharedValue<number>;
  count: number;
  activeWeight: number;
  /** Ширина ряда вкладок, px. */
  width: number;
  color: string;
  /** Линия — у верхнего края (у прикреплённой панели). */
  lineOnTop: boolean;
  radius: number;
}

/** Отметка выбора: подложка, точка или линия; геометрия — на UI-потоке. */
export const TabBarIndicator: FC<ITabBarIndicatorProps> = ({
  type,
  position,
  start,
  end,
  count,
  activeWeight,
  width,
  color,
  lineOnTop,
  radius,
}) => {
  const style = useAnimatedStyle(() => {
    const frames = tabFrames(position.value, count, activeWeight, width);
    const span = indicatorSpan(frames, start.value, end.value);
    const center = span.x + span.width / 2;

    if (type === "pill") {
      return {
        left: span.x + PILL_INSET,
        width: Math.max(span.width - PILL_INSET * 2, 0),
      };
    }

    if (type === "dot") {
      return { left: center - DOT_SIZE / 2, width: DOT_SIZE };
    }

    return { left: center - LINE_WIDTH / 2, width: LINE_WIDTH };
  }, [type, position, start, end, count, activeWeight, width]);

  const shape =
    type === "pill"
      ? [styles.pill, { borderRadius: radius }]
      : type === "dot"
        ? styles.dot
        : [styles.line, lineOnTop ? styles.lineTop : styles.lineBottom];

  return (
    <Animated.View
      pointerEvents={"none"}
      style={[shape, { backgroundColor: color }, style]}
    />
  );
};

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    top: PILL_INSET,
    bottom: PILL_INSET,
  },
  dot: {
    position: "absolute",
    bottom: 3,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  line: {
    position: "absolute",
    height: LINE_HEIGHT,
    borderRadius: LINE_HEIGHT / 2,
  },
  lineTop: {
    top: 0,
  },
  lineBottom: {
    bottom: 0,
  },
});
