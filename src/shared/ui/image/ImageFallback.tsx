import { useTheme } from "@shared/lib/theme";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import { Icon, TIconName } from "../icon";

export interface IImageFallbackProps {
  icon?: TIconName;
  iconSize?: number;
}

/** Стандартный фолбэк: нейтральная заливка с иконкой по центру. */
export const ImageFallback: FC<IImageFallbackProps> = memo(
  ({ icon = "image", iconSize = 24 }) => {
    const { colors } = useTheme();

    return (
      <View
        style={[styles.container, { backgroundColor: colors.onSurface }]}
        accessibilityLabel={"Изображение не загрузилось"}
      >
        <Icon name={icon} size={iconSize} color={colors.textTertiary} />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
