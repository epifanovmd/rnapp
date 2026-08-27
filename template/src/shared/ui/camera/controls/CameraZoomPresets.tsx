import React, { FC, memo, useCallback, useState } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { HapticFeedbackTypes, trigger } from "react-native-haptic-feedback";
import { useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Touchable } from "../../touchable";
import { useCameraApi } from "../core/camera-context";

export interface ICameraZoomPresetsProps {
  /** Кратности чипов; по умолчанию — пресеты под устройство из API */
  presets?: number[];
  /** Позиция ряда; по умолчанию — снизу по центру кадра */
  style?: StyleProp<ViewStyle>;
}

const formatZoom = (value: number): string =>
  `${Number.isInteger(value) ? value : value.toFixed(1)}×`;

/**
 * Чипы кратности зума (0.5× / 1× / 2× …): активный подсвечивается и
 * следует за пинчем, тап плавно анимирует зум к пресету.
 */
export const CameraZoomPresets: FC<ICameraZoomPresetsProps> = memo(
  ({ presets, style }) => {
    const { zoom } = useCameraApi();
    const values = presets ?? zoom.presets;

    const [activeIndex, setActiveIndex] = useState(() => {
      const initial = values.indexOf(1);

      return initial >= 0 ? initial : 0;
    });

    useAnimatedReaction(
      () => {
        let nearest = 0;

        for (let index = 1; index < values.length; index++) {
          const candidate = values[index] ?? 0;
          const best = values[nearest] ?? 0;

          if (
            Math.abs(zoom.zoom.value - candidate) <
            Math.abs(zoom.zoom.value - best)
          ) {
            nearest = index;
          }
        }

        return nearest;
      },
      (nearest, previous) => {
        if (nearest !== previous) {
          scheduleOnRN(setActiveIndex, nearest);
        }
      },
      [values],
    );

    const handlePress = useCallback(
      (value: number | undefined) => {
        if (value == null) {
          return;
        }

        trigger(HapticFeedbackTypes.selection);
        zoom.setZoom(value);
      },
      [zoom],
    );

    if (values.length < 2) {
      return null;
    }

    return (
      <View style={[styles.host, style]} pointerEvents={"box-none"}>
        <View style={styles.row}>
          {values.map((value, index) => (
            <Touchable
              key={value}
              style={[styles.chip, index === activeIndex && styles.chipActive]}
              ctx={value}
              onPress={handlePress}
            >
              <Text
                style={[
                  styles.label,
                  index === activeIndex && styles.labelActive,
                ]}
                allowFontScaling={false}
              >
                {formatZoom(value)}
              </Text>
            </Touchable>
          ))}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
    gap: 6,
    padding: 4,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  chip: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  chipActive: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
  },
  label: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  labelActive: {
    color: "#FFD60A",
  },
});
