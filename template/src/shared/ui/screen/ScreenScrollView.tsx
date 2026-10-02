import { TPullToRefreshScroll } from "@shared/lib/pull-to-refresh";
import React, { ComponentPropsWithRef } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

export interface IScreenScrollViewProps extends ComponentPropsWithRef<
  typeof Animated.ScrollView
> {
  /** Жест протяжки; null — без pull-to-refresh. */
  gesture?: TPullToRefreshScroll["gesture"] | null;
}

/**
 * ScrollView экрана: GestureDetector протяжки ставится вплотную к самому
 * ScrollView — детектор цепляется к прямому ребёнку.
 */
export const ScreenScrollView = ({
  gesture,
  ...props
}: IScreenScrollViewProps) => {
  const scrollView = <Animated.ScrollView {...props} />;

  return gesture ? (
    <GestureDetector gesture={gesture}>{scrollView}</GestureDetector>
  ) : (
    scrollView
  );
};
