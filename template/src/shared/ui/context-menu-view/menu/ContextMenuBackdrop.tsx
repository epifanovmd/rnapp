import { BlurView } from "@react-native-community/blur";
import React, { FC, memo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { AnimatedStyle } from "react-native-reanimated";

import { IContextMenuTheme } from "../utils";

export interface IContextMenuBackdropProps {
  theme: IContextMenuTheme;
  animatedStyle: AnimatedStyle<ViewStyle>;
}

export const ContextMenuBackdrop: FC<IContextMenuBackdropProps> = memo(
  ({ theme, animatedStyle }) => (
    <Animated.View
      style={[StyleSheet.absoluteFill, animatedStyle]}
      pointerEvents="none"
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={theme.backdropBlurType}
        blurAmount={10}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: theme.backdropColor },
        ]}
      />
    </Animated.View>
  ),
);
