import { useTheme, useTransition } from "@core";
import { memo, PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface IHiddenNavBarProps {
  safeArea?: boolean;
}

export const HiddenBar = memo<PropsWithChildren<IHiddenNavBarProps>>(
  ({ children, safeArea }) => {
    const { colors } = useTheme();
    const { navbarHeight, setNavbarHeight, navbarOffset } = useTransition();
    const insets = useSafeAreaInsets();
    const top = safeArea ? insets.top : 0;

    const animatedStyle = useAnimatedStyle(() => {
      const translateY = interpolate(
        navbarOffset.value,
        [navbarHeight, 0],
        [-navbarHeight, 0],
        "clamp",
      );

      const opacity = interpolate(
        navbarOffset.value,
        [0, navbarHeight / 3, navbarHeight],
        [1, 0, 0],
        "clamp",
      );

      return {
        top,
        transform: [{ translateY }],
        // opacity,
      };
    }, [top, navbarHeight]);

    const backgroundColor = colors.background;

    return (
      <View style={[styles.container, { paddingTop: top }]}>
        <View style={[styles.overlay, { backgroundColor, paddingTop: top }]} />
        <Animated.View
          style={[styles.animatedContainer, animatedStyle]}
          onLayout={event => {
            setNavbarHeight(event.nativeEvent.layout.height);
          }}
        >
          {children}
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
