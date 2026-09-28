import React, { memo, ReactNode, useCallback, useState } from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

import { FlexViewProps, Row } from "../flex-view";

export interface BalancedRowProps extends FlexViewProps {
  /** Стиль центральной зоны. */
  centerStyle?: StyleProp<ViewStyle>;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  /** Стиль обеих боковых зон. */
  sideStyle?: StyleProp<ViewStyle>;
}

/**
 * Строка из трёх зон: боковые получают общую `minWidth` по большей из них,
 * поэтому центральная зона остаётся строго по центру строки независимо от
 * того, что лежит по бокам. Ширина меряется по внутреннему блоку — на него
 * `minWidth` не действует, поэтому пересчёт сходится за один проход.
 */
export const BalancedRow = memo<BalancedRowProps>(
  ({
    centerStyle,
    children,
    leftContent,
    rightContent,
    sideStyle,
    ...rest
  }) => {
    const [leftWidth, setLeftWidth] = useState(0);
    const [rightWidth, setRightWidth] = useState(0);

    const onLeftLayout = useCallback(
      ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        setLeftWidth(current =>
          current === layout.width ? current : layout.width,
        );
      },
      [],
    );

    const onRightLayout = useCallback(
      ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
        setRightWidth(current =>
          current === layout.width ? current : layout.width,
        );
      },
      [],
    );

    const sideWidth = { minWidth: Math.max(leftWidth, rightWidth) };

    return (
      <Row {...rest}>
        <View style={[SS.side, sideWidth, sideStyle]}>
          <View style={SS.measured} onLayout={onLeftLayout}>
            {leftContent}
          </View>
        </View>
        <View style={[SS.center, centerStyle]}>{children}</View>
        <View style={[SS.side, SS.rightSide, sideWidth, sideStyle]}>
          <View style={SS.measured} onLayout={onRightLayout}>
            {rightContent}
          </View>
        </View>
      </Row>
    );
  },
);

const SS = StyleSheet.create({
  side: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  rightSide: {
    justifyContent: "flex-end",
  },
  measured: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  center: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
