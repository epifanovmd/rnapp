import React, { FC, memo, useMemo } from "react";
import { View } from "react-native";
import { SharedValue } from "react-native-reanimated";

import { withOpacity } from "../../../utils";
import { IWaveBarGeometry, WaveBar, waveBarBase } from "./WaveBar";

/**
 * Волновая форма голосового. Анимируются столбики только у активного трека —
 * у остальных это статичные вью без единого worklet.
 */

interface IVoiceWaveformProps {
  bars: number[];
  barWidth: number;
  /** Ширина столбика плюс промежуток — шаг раскладки. */
  barTotal: number;
  minHeight: number;
  height: number;
  activeColor: string;
  inactiveColor: string;
  progress: SharedValue<number>;
  isActive: boolean;
  /** Трек не загрузился — волна приглушена. Порт `setDimmed`. */
  isDimmed: boolean;
}

export const VoiceWaveform: FC<IVoiceWaveformProps> = memo(
  ({
    bars,
    barWidth,
    barTotal,
    minHeight,
    height,
    activeColor,
    inactiveColor,
    progress,
    isActive,
    isDimmed,
  }) => {
    const geometry = useMemo<IWaveBarGeometry[]>(
      () =>
        bars.map((value, i) => ({
          left: i * barTotal,
          width: barWidth,
          height: Math.max(minHeight, Math.min(Math.max(value, 0), 1) * height),
          borderRadius: barWidth / 2,
        })),
      [bars, barTotal, barWidth, minHeight, height],
    );

    if (!isActive) {
      const color = isDimmed ? withOpacity(inactiveColor, 0.3) : inactiveColor;

      return (
        <>
          {geometry.map((bar, i) => (
            <View
              key={i}
              style={[waveBarBase, bar, { backgroundColor: color }]}
            />
          ))}
        </>
      );
    }

    return (
      <>
        {geometry.map((bar, i) => (
          <WaveBar
            key={i}
            geometry={bar}
            threshold={i / geometry.length}
            progress={progress}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
          />
        ))}
      </>
    );
  },
);

VoiceWaveform.displayName = "VoiceWaveform";
