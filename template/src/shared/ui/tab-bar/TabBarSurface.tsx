import { BlurView } from "@react-native-community/blur";
import { useTheme } from "@shared/lib/theme";
import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

import type { TTabBarSurface } from "./tab-bar.types";
import { withAlpha } from "./tab-bar-colors";

interface ITabBarSurfaceProps {
  surface: TTabBarSurface;
}

/** Фон панели: размытие по теме с лёгкой подцветкой поверхности или сплошной цвет. */
export const TabBarSurface: FC<ITabBarSurfaceProps> = ({ surface }) => {
  const { colors, isLight } = useTheme();

  if (surface === "solid") {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]}
      />
    );
  }

  return (
    <>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isLight ? "light" : "dark"}
        blurAmount={20}
        reducedTransparencyFallbackColor={colors.surface}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: withAlpha(colors.surface, isLight ? 0.55 : 0.45) },
        ]}
      />
    </>
  );
};
