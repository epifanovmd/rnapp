import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC, memo, useMemo } from "react";
import { StyleSheet, View, ViewProps } from "react-native";

import { Image } from "../image";
import { Text } from "../text";

export interface IAvatarProps extends ViewProps {
  url?: string;
  /** Имя для инициалов и детерминированного цвета фона (когда нет url). */
  name?: string;
  size?: number;
  /** Радиус скругления; по умолчанию круг. */
  borderRadius?: number;
  /** Индикатор online-статуса. */
  online?: boolean;
}

const FALLBACK_COLORS: (keyof TColorTheme)[] = [
  "blue400",
  "green600",
  "orange600",
  "red500",
  "slate400",
];

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]!.toUpperCase())
    .join("");

const hashName = (name: string): number => {
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) % 1_000_000_007;
  }

  return hash;
};

export const Avatar: FC<IAvatarProps> = memo(
  ({ url, name = "", size = 40, borderRadius, online, style, ...rest }) => {
    const { colors } = useTheme();
    const radius = borderRadius ?? size / 2;

    const fallbackColor = useMemo(
      () => colors[FALLBACK_COLORS[hashName(name) % FALLBACK_COLORS.length]],
      [colors, name],
    );

    const dotSize = Math.max(8, size / 4);

    return (
      <View style={[{ width: size, height: size }, style]} {...rest}>
        {url ? (
          <Image url={url} width={size} height={size} radius={radius} />
        ) : (
          <View
            style={[
              styles.fallback,
              {
                width: size,
                height: size,
                borderRadius: radius,
                backgroundColor: fallbackColor,
              },
            ]}
          >
            <Text color={"white"} fontSize={size * 0.4} fontWeight={"600"}>
              {getInitials(name) || "?"}
            </Text>
          </View>
        )}
        {online !== undefined && (
          <View
            style={[
              styles.status,
              {
                width: dotSize,
                height: dotSize,
                borderRadius: dotSize / 2,
                backgroundColor: online ? colors.success : colors.textTertiary,
                borderColor: colors.background,
              },
            ]}
          />
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  status: {
    position: "absolute",
    right: 0,
    bottom: 0,
    borderWidth: 2,
  },
});
