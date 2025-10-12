import { useTheme, useTransition } from "@core";
import { createSlot, useSlotProps } from "@force-dev/react";
import React, { memo, PropsWithChildren } from "react";
import { ImageProps, StyleSheet, ViewProps } from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface IHiddenNavbarProps extends ViewProps {
  uri?: string;
  height?: number;
  safeArea?: boolean;
}

const _ImageBar = memo<PropsWithChildren<IHiddenNavbarProps>>(
  ({ uri, height = 250, safeArea, style, children, ...rest }) => {
    const { colors } = useTheme();
    const { navbarHeight, onLayoutNavBar, transitionY } = useTransition();
    const insets = useSafeAreaInsets();
    const { $children, image } = useSlotProps(ImageBar, children);

    const top = safeArea ? insets.top : 0;

    const animatedStyles = useAnimatedStyle(() => {
      return {
        height: interpolate(
          transitionY.value,
          [0, height - height / 4, height],
          [height, navbarHeight, navbarHeight],
        ),
        opacity: interpolate(
          transitionY.value,
          [0, height - height / 2, height - height / 4, height],
          [1, 1, 0.4, 0.4],
        ),
      };
    }, [navbarHeight]);

    const backgroundColor = colors.background;

    return (
      <Animated.View
        onLayout={onLayoutNavBar}
        style={[{ backgroundColor, paddingTop: top }]}
        {...rest}
      >
        {(uri || image) && (
          <Animated.Image
            source={{ uri }}
            {...image}
            style={[SS.image, animatedStyles, image?.style]}
          />
        )}
        {$children}
      </Animated.View>
    );
  },
);

export const ImageBar = Object.assign(_ImageBar, {
  Image: createSlot<ImageProps>("Image"),
});

const SS = StyleSheet.create({
  image: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
});
