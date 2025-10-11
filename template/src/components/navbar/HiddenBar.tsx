import { useTheme, useTransition } from "@core";
import { memo, PropsWithChildren, useCallback, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { INavbarProps, Navbar } from "./Navbar";

export interface IHiddenNavBarProps extends INavbarProps {
  safeArea?: boolean;
  stickyContent?: boolean;
}

export const HiddenBar = memo<PropsWithChildren<IHiddenNavBarProps>>(
  ({ safeArea, stickyContent = true, children, ...rest }) => {
    const { colors } = useTheme();
    const [contentHeight, setContentHeight] = useState(0);
    const { navbarHeight, onLayoutNavBar, navbarOffset } = useTransition();
    const insets = useSafeAreaInsets();
    const top = safeArea ? insets.top : 0;

    const navHeight = navbarHeight - (stickyContent ? contentHeight : 0);

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

    const opacityStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        navbarOffset.value,
        [0, navHeight / 3, navHeight],
        [1, 0, 0],
        "clamp",
      );

      return {
        opacity,
      };
    });

    const backgroundColor = colors.background;
    const onLayout = useCallback((e: LayoutChangeEvent) => {
      setContentHeight(e.nativeEvent.layout.height);
    }, []);

    return (
      <View style={[styles.container, { backgroundColor, paddingTop: top }]}>
        {safeArea && (
          <View
            style={[styles.overlay, { backgroundColor, paddingTop: top }]}
          />
        )}
        <Animated.View
          onLayout={onLayoutNavBar}
          style={[styles.animatedContainer, { backgroundColor }, animatedStyle]}
        >
          <Navbar {...rest} />
          <View onLayout={onLayout}>{children}</View>
        </Animated.View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 999,
    backgroundColor: "pink",
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
