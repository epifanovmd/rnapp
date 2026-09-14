import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

import type { TCalendarMonthKey } from "../calendar.types";
import { CalendarMonthConnected } from "./CalendarMonthConnected";

export interface ICalendarSlidePageProps {
  monthKey: TCalendarMonthKey;
  /** Номер месяца относительно якоря слайдера: 0 — стартовый, 1 — следующий, -1 — предыдущий. */
  index: number;
  /** Текущая страница; во время анимации — дробная. */
  page: SharedValue<number>;
  /** Сдвиг пальцем, px. */
  offset: SharedValue<number>;
  width: SharedValue<number>;
  /** Нажатия принимает только текущая страница. */
  interactive: boolean;
}

/** Страница слайдера. Её позиция считается на UI-потоке из индекса, текущей страницы и сдвига пальцем. */
export const CalendarSlidePage: FC<ICalendarSlidePageProps> = memo(
  ({ monthKey, index, page, offset, width, interactive }) => {
    const style = useAnimatedStyle(() => ({
      transform: [
        { translateX: (index - page.value) * width.value + offset.value },
      ],
    }));

    return (
      <Animated.View
        pointerEvents={interactive ? "auto" : "none"}
        style={[SS.page, style]}
      >
        <CalendarMonthConnected monthKey={monthKey} />
      </Animated.View>
    );
  },
);

const SS = StyleSheet.create({
  page: { position: "absolute", top: 0, left: 0, right: 0 },
});
