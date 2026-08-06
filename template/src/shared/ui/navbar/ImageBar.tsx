import { useScroll } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import { useTransition } from "@shared/lib/transition";
import React from "react";
import { StyleSheet, ViewProps } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
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
  image: slot.of(Animated.Image, { always: true }),
};

const ImageBarRoot = ({
  props,
  slots,
  content,
}: CompoundRootProps<IImageBarProps, typeof imageBarSlots>) => {
  const {
    uri,
    height = 250,
    activeScrollOpacity = 0.4,
    safeArea,
    style,
    ...rest
  } = props;
  const { colors } = useTheme();
  const { navbar } = useTransition();
  const { height: navbarHeight, onLayout: onLayoutNavBar } = navbar;
  const staticOffsetY = useSharedValue(0);
  // вне ScrollProvider бар остаётся статичным
  const scrollY = useScroll()?.offsetY ?? staticOffsetY;
  const insets = useSafeAreaInsets();
  const { image } = slots;

  const top = safeArea ? insets.top : 0;

  const animatedStyles = useAnimatedStyle(() => {
    return {
      height: interpolate(
        scrollY.value,
        [0, height - navbarHeight, height - navbarHeight],
        [height, navbarHeight, navbarHeight],
      ),
      opacity: interpolate(
        scrollY.value,
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
      {(!!uri || image.present) &&
        image.render({
          defaults: {
            source: { uri },
            style: [StyleSheet.absoluteFill, SS.image, animatedStyles],
          },
        })}
      {content}
    </Animated.View>
  );
};

export const ImageBar = createCompound<IImageBarProps>()({
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
