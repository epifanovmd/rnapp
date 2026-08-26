import { BlurView } from "@react-native-community/blur";
import React, { FC, memo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Animated, { AnimatedStyle } from "react-native-reanimated";

import { IContextMenuColors, IContextMenuStyles } from "../config";

/** Затемнение с размытием под меню. */

export interface IContextMenuBackdropProps {
  colors: IContextMenuColors;
  styles: IContextMenuStyles;
  animatedStyle: AnimatedStyle<ViewStyle>;
}

export const ContextMenuBackdrop: FC<IContextMenuBackdropProps> = memo(
  ({ colors, styles, animatedStyle }) => (
    <Animated.View
      style={[StyleSheet.absoluteFill, animatedStyle]}
      pointerEvents="none"
    >
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={colors.backdropBlurType}
        blurAmount={10}
      />
      <View style={[StyleSheet.absoluteFill, styles.backdropTint]} />
    </Animated.View>
  ),
);

ContextMenuBackdrop.displayName = "ContextMenuBackdrop";
