import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

export interface ICameraGridProps {
  color?: string;
}

/** Сетка третей поверх кадра — помощь в кадрировании */
export const CameraGrid: FC<ICameraGridProps> = memo(
  ({ color = "rgba(255, 255, 255, 0.28)" }) => {
    const tint = { backgroundColor: color };

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents={"none"}>
        <View style={[styles.vertical, styles.firstThird, tint]} />
        <View style={[styles.vertical, styles.secondThird, tint]} />
        <View style={[styles.horizontal, styles.firstThirdTop, tint]} />
        <View style={[styles.horizontal, styles.secondThirdTop, tint]} />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  vertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  horizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  firstThird: {
    left: "33.33%",
  },
  secondThird: {
    left: "66.66%",
  },
  firstThirdTop: {
    top: "33.33%",
  },
  secondThirdTop: {
    top: "66.66%",
  },
});
