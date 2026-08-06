import { useTheme } from "@shared/lib/theme";
import { useTransition } from "@shared/lib/transition";
import React, { useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View, ViewProps } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";

export interface IHiddenNavbarProps extends ViewProps {
  safeArea?: boolean;
}

const hiddenBarSlots = {
  stickyContent: slot.of(View),
};

const HiddenBarRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<IHiddenNavbarProps, typeof hiddenBarSlots>) => {
  const { safeArea, style, ...rest } = props;
  const { colors } = useTheme();
  const [contentHeight, setContentHeight] = useState(0);
  const { navbarHeight, onLayoutNavBar, navbarOffset } = useTransition();
  const insets = useSafeAreaInsets();
  const { stickyContent } = slots;

  const top = safeArea ? insets.top : 0;

  const navHeight = navbarHeight - (stickyContent.present ? contentHeight : 0);

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      navbarOffset.value,
      [navHeight, 0],
      [-navHeight, 0],
      "clamp",
    );

    return {
      top,
      transform: [{ translateY }],
    };
  }, [top, navHeight]);

  const backgroundColor = colors.background;
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setContentHeight(e.nativeEvent.layout.height);
  }, []);

  return (
    <View
      style={[styles.container, { backgroundColor, paddingTop: top }, style]}
      {...rest}
    >
      {safeArea && (
        <View style={[styles.overlay, { backgroundColor, paddingTop: top }]} />
      )}
      <Animated.View
        onLayout={onLayoutNavBar}
        style={[styles.animatedContainer, { backgroundColor }, animatedStyle]}
      >
        {content}
        {stickyContent.render({ inject: { onLayout } })}
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
