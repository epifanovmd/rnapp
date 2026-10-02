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
import { Image } from "../image";
import {
  BarSurfaceContext,
  bottomRadiusStyle,
  IBarAppearanceProps,
  resolveBarBackground,
} from "./bar-appearance";
import { useNavbar } from "./navbar-bar";

/** Скругление нижних углов по умолчанию, px. */
const DEFAULT_RADIUS = 24;

/** Схлопывается при скролле, поэтому требует ScrollProvider выше по дереву */
export interface IImageBarProps extends ViewProps, IBarAppearanceProps {
  uri?: string;
  height?: number;
  safeArea?: boolean;
  activeScrollOpacity?: number;
}

const imageBarSlots = {
  /** Image кита: скелетон на загрузке и фолбэк при ошибке из коробки. */
  image: slot.of(Image, { always: true }),
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
    background,
    bottomRadius = DEFAULT_RADIUS,
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

  const backgroundColor = resolveBarBackground(background, colors);
  const radiusStyle = bottomRadiusStyle(bottomRadius);

  return (
    <Animated.View
      onLayout={navbar.onLayout}
      style={[
        StyleSheet.absoluteFill,
        SS.containerStyle,
        radiusStyle,
        {
          backgroundColor,
          paddingTop: top,
        },
        style,
      ]}
      {...rest}
    >
      {(!!uri || image.present) && (
        // высота/прозрачность анимируются обёрткой — Image остаётся простым
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            SS.image,
            radiusStyle,
            animatedStyles,
          ]}
        >
          {image.render({
            defaults: {
              url: uri,
              style: StyleSheet.absoluteFill,
            },
          })}
        </Animated.View>
      )}
      <BarSurfaceContext.Provider value={true}>{content}</BarSurfaceContext.Provider>
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
    zIndex: 1,
  },
  image: {
    overflow: "hidden",
  },
});
