import { clampOffset, resolveCollapseRange } from "@shared/lib/bars";
import { useTheme } from "@shared/lib/theme";
import React, { useCallback, useEffect } from "react";
import { LayoutChangeEvent, StyleSheet, View, ViewProps } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import {
  BarSurfaceContext,
  bottomRadiusStyle,
  IBarAppearanceProps,
  resolveBarBackground,
} from "./bar-appearance";
import { useNavbar } from "./navbar-bar";

export interface IHiddenNavbarProps extends ViewProps, IBarAppearanceProps {
  safeArea?: boolean;
}

const hiddenBarSlots = {
  stickyContent: slot.of(View),
};

/**
 * Скрываемая шапка: прячется всё, кроме StickyContent. Высоты шапки и
 * закреплённой части уходят в панель прямо из onLayout, а сдвиг считается
 * worklet'ом по shared values — живая высота содержимого не ждёт ре-рендера
 * и не дёргает скрытую шапку (offset перебазируется в панели).
 */
const HiddenBarRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<IHiddenNavbarProps, typeof hiddenBarSlots>) => {
  const { safeArea, style, background, bottomRadius, ...rest } = props;
  const { colors } = useTheme();
  const navbar = useNavbar();
  const insets = useSafeAreaInsets();
  const { stickyContent } = slots;
  const { offset, height, pinned } = navbar;

  const top = safeArea ? insets.top : 0;

  const onStickyLayout = useCallback(
    (event: LayoutChangeEvent) =>
      navbar.setPinnedHeight(event.nativeEvent.layout.height),
    [navbar],
  );

  useEffect(() => {
    if (!stickyContent.present) {
      navbar.setPinnedHeight(0);
    }
  }, [navbar, stickyContent.present]);

  useEffect(() => () => navbar.setPinnedHeight(0), [navbar]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: -clampOffset(
          offset.value,
          resolveCollapseRange(height.value, pinned.value),
        ),
      },
    ],
  }));

  const backgroundColor = resolveBarBackground(background, colors);

  return (
    <View
      style={[styles.container, { backgroundColor, paddingTop: top }, style]}
      {...rest}
    >
      {safeArea && (
        <View style={[styles.overlay, { backgroundColor, paddingTop: top }]} />
      )}
      <Animated.View
        onLayout={navbar.onLayout}
        style={[
          styles.animatedContainer,
          { backgroundColor, top },
          bottomRadiusStyle(bottomRadius),
          animatedStyle,
        ]}
      >
        <BarSurfaceContext.Provider value={true}>
          {content}
          {stickyContent.render({ inject: { onLayout: onStickyLayout } })}
        </BarSurfaceContext.Provider>
      </Animated.View>
    </View>
  );
};

export const HiddenBar = createCompound<IHiddenNavbarProps>()({
  name: "HiddenBar",
  render: HiddenBarRoot,
  slots: hiddenBarSlots,
});

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 999,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 998,
  },
  animatedContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 997,
  },
});
