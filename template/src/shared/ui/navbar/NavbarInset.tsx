import React from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useNavbar } from "./navbar-bar";

export interface INavbarInsetProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Отступ контента под навигационную панель: первый элемент скролла вместо
 * paddingTop = useNavbarHeight(). Высота анимируется к каждому переизмерению
 * панели, поэтому живая высота шапки не дёргает контент.
 */
export const NavbarInset = ({ style }: INavbarInsetProps) => {
  const { inset } = useNavbar();

  const animatedStyle = useAnimatedStyle(() => ({ height: inset.value }));

  return <Animated.View pointerEvents={"none"} style={[style, animatedStyle]} />;
};
