import { useInterpolatedValue } from "@shared/lib/animation";
import { useBarHeight } from "@shared/lib/bars";
import { useScroll } from "@shared/lib/scroll";
import { useTheme } from "@shared/lib/theme";
import React from "react";
import { StyleSheet, ViewProps } from "react-native";
import Animated, {
  Extrapolation,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { useNavbar } from "./navbar-bar";

/** Схлопывается при скролле, поэтому требует ScrollProvider выше по дереву */
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
  const navbar = useNavbar();
  const barHeight = useBarHeight(navbar);
  const { offsetY: scrollY } = useScroll();
  const insets = useSafeAreaInsets();
  const { image } = slots;

  const top = safeArea ? insets.top : 0;

  // EXTEND сверху: на bounce картинка растягивается, как у нативного хедера
  const imageHeight = useInterpolatedValue(
    scrollY,
    [0, height - barHeight, height - barHeight],
    [height, barHeight, barHeight],
    Extrapolation.EXTEND,
  );
  const imageOpacity = useInterpolatedValue(
    scrollY,
    [0, (height - barHeight) / 2, height - barHeight],
    [1, 1, activeScrollOpacity],
  );

  const animatedStyles = useAnimatedStyle(() => ({
    height: imageHeight.value,
    opacity: imageOpacity.value,
  }));

  const backgroundColor = colors.background;

  return (
    <Animated.View
      onLayout={navbar.onLayout}
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
