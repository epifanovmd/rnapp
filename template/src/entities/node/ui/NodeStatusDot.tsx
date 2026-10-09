import type { ENodeStatus } from "@shared/api/gen/main/model";
import { TColorTheme, useTheme } from "@shared/lib/theme";
import React, { FC } from "react";
import { StyleSheet, View } from "react-native";

import { type INodeStatusView, NODE_STATUS } from "../lib/status";

const DOT_COLOR: Record<INodeStatusView["variant"], keyof TColorTheme> = {
  success: "success",
  warning: "warning",
  destructive: "danger",
  info: "info",
  muted: "textTertiary",
};

interface INodeStatusDotProps {
  status: ENodeStatus;
  size?: number;
}

/** Точка статуса узла в цвете метки статуса. */
export const NodeStatusDot: FC<INodeStatusDotProps> = ({
  status,
  size = 8,
}) => {
  const { colors } = useTheme();
  const view = NODE_STATUS[status];

  return (
    <View
      accessibilityLabel={view.label}
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors[DOT_COLOR[view.variant]],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  dot: { flexShrink: 0 },
});
