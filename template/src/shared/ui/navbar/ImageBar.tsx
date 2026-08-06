import { useTheme } from "@shared/lib/theme";
import { useTransition } from "@shared/lib/transition";
import React, { memo } from "react";
import { ImageProps, StyleSheet, ViewProps } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import absoluteFill = StyleSheet.absoluteFill;

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";

export interface IImageBarProps extends ViewProps {
  uri?: string;
  height?: number;
  safeArea?: boolean;
  activeScrollOpacity?: number;
}

const imageBarSlots = {
  image: slot<ImageProps>({ component: Animated.Image }),
};

const ImageBarRoot = memo(
  ({
    props,
    slots,
    content,
  }: CompoundRootProps<IImageBarProps, never, typeof imageBarSlots>) => {
    const {
      uri,
      height = 250,
      activeScrollOpacity = 0.4,
      safeArea,
      style,
      ...rest
    } = props;
    const { colors } = useTheme();
    const { navbarHeight, onLayoutNavBar, transitionY } = useTransition();
    const insets = useSafeAreaInsets();
    const { image } = slots;

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
          },
        ]}
        {...rest}
      >
        {(uri || image.present) && (
          <Animated.Image
            source={{ uri }}
            {...image.props}
            style={[
              StyleSheet.absoluteFill,
              SS.image,
              animatedStyles,
              image.props?.style,
            ]}
          />
        )}
        {content}
      </Animated.View>
    );
  },
);

export const ImageBar = createCompound<IImageBarProps, never>()({
  name: "ImageBar",
  render: ImageBarRoot,
  slots: imageBarSlots,
});

const SS = StyleSheet.create({
  containerStyle: {
    bottom: "auto",
    borderRadius: 24,
    zIndex: 1,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  image: {
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
});
