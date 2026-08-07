import React, { memo } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { IDialogBackdropProps } from "./types";

export interface DialogBackdropProps extends IDialogBackdropProps {
  color?: string;
  opacity?: number;
}

/** Подложка по умолчанию: затемнение, следующее за прогрессом диалога. */
export const DialogBackdrop = memo(
  ({
    progress,
    color = "#000000",
    opacity = 0.6,
    style,
  }: DialogBackdropProps) => {
    const animatedStyle = useAnimatedStyle(
      () => ({
        backgroundColor: color,
        opacity: opacity * progress.value,
      }),
      [color, opacity],
    );

    return <Animated.View style={[style, animatedStyle]} />;
  },
);
