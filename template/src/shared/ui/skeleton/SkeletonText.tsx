import React, { FC, memo } from "react";
import { DimensionValue, View, ViewProps } from "react-native";

import { SkeletonBase } from "./SkeletonBase";

export interface ISkeletonTextProps extends ViewProps {
  /** Количество строк. */
  lines?: number;
  lineHeight?: number;
  /** Расстояние между строками. */
  gap?: number;
  /** Ширина последней строки (обрыв абзаца). */
  lastLineWidth?: DimensionValue;
  borderRadius?: number;
  /** Растяжение в Row/Col-композициях. */
  flex?: number;
  animated?: boolean;
}

/** Многострочный текст-плейсхолдер: последняя строка короче, как обрыв абзаца. */
export const SkeletonText: FC<ISkeletonTextProps> = memo(
  ({
    lines = 3,
    lineHeight = 14,
    gap = 8,
    lastLineWidth = "60%",
    borderRadius = 4,
    flex,
    animated = true,
    style,
    ...rest
  }) => (
    <View style={[{ gap }, flex !== undefined && { flex }, style]} {...rest}>
      {Array.from({ length: lines }, (_, index) => (
        <SkeletonBase
          key={index}
          height={lineHeight}
          borderRadius={borderRadius}
          animated={animated}
          width={index === lines - 1 && lines > 1 ? lastLineWidth : "100%"}
        />
      ))}
    </View>
  ),
);
