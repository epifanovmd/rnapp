import { useTheme, useTransition } from "@core";
import { createSlot, useSlotProps } from "@force-dev/react";
import React, { memo, PropsWithChildren } from "react";
import { ImageProps, StyleSheet, ViewProps } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import absoluteFill = StyleSheet.absoluteFill;

export interface IImageBarProps extends ViewProps {
  uri?: string;
  height?: number;
  safeArea?: boolean;
  activeScrollOpacity?: number;
}

const _ImageBar = memo<PropsWithChildren<IImageBarProps>>(
  ({
    uri,
    height = 250,
    activeScrollOpacity = 0.4,
    safeArea,
    style,
    children,
    ...rest
  }) => {
    const { colors } = useTheme();
    const { navbarHeight, onLayoutNavBar, transitionY } = useTransition();
    const insets = useSafeAreaInsets();
    const { $children, image } = useSlotProps(ImageBar, children);

    const top = safeArea ? insets.top : 0;

    const animatedStyles = useAnimatedStyle(() => {
      return {
        height: interpolate(
          transitionY.value,
          [0, height - navbarHeight, height - navbarHeight],
          [height, navbarHeight, navbarHeight],
        ),
        opacity: interpolate(
          transitionY.value,
          [0, (height - navbarHeight) / 2, height - navbarHeight],
          [1, 1, activeScrollOpacity],
          Extrapolation.CLAMP,
        ),
      };
    }, [navbarHeight, activeScrollOpacity]);

    const backgroundColor = colors.background;

    return (
      <Animated.View
        onLayout={onLayoutNavBar}
        style={[
          StyleSheet.absoluteFill,
          SS.containerStyle,
          {
            backgroundColor,
            paddingTop: top,
            borderRadius: 24,
          },
        ]}
        {...rest}
      >
        {(uri || image) && (
          <Animated.Image
            source={{ uri }}
            {...image}
            style={[
              StyleSheet.absoluteFill,
              SS.image,
              animatedStyles,
              image?.style,
            ]}
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
  containerStyle: {
    bottom: "auto",
    zIndex: 1,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  image: {
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
});
