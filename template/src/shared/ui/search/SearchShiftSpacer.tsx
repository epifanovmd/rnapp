import type { ISearchBarSync } from "@shared/lib/search";
import React, { FC } from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

interface ISearchShiftSpacerProps {
  sync: ISearchBarSync;
}

/** Распорка в конце прокручиваемого содержимого `SearchShiftView`: последний элемент доступен. */
export const SearchShiftSpacer: FC<ISearchShiftSpacerProps> = ({ sync }) => {
  const { shiftRange } = sync;
  const style = useAnimatedStyle(
    () => ({ height: shiftRange.value }),
    [shiftRange],
  );

  return <Animated.View pointerEvents={"none"} style={style} />;
};
