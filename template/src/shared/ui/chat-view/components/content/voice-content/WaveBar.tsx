import React, { FC, memo } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

/** Геометрия одного столбика волны. */
export interface IWaveBarGeometry {
  left: number;
  width: number;
  height: number;
  borderRadius: number;
}

interface IWaveBarProps {
  geometry: IWaveBarGeometry;
  /** Доля позиции столбика в волне — с ней сравнивается прогресс. */
  threshold: number;
  progress: SharedValue<number>;
  activeColor: string;
  inactiveColor: string;
}

/** Столбик активного трека: цвет ведёт shared value, без ре-рендера. */
export const WaveBar: FC<IWaveBarProps> = memo(
  ({ geometry, threshold, progress, activeColor, inactiveColor }) => {
    const animated = useAnimatedStyle(() => ({
      backgroundColor: progress.value > threshold ? activeColor : inactiveColor,
    }));

    return <Animated.View style={[waveBarBase, geometry, animated]} />;
  },
);

WaveBar.displayName = "WaveBar";

/** Общая база столбика — её же использует статичный вариант волны. */
export const waveBarBase: ViewStyle = StyleSheet.create({
  bar: { position: "absolute", bottom: 0 },
}).bar;
