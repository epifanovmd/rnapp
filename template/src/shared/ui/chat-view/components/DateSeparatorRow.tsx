import React, { FC, memo } from "react";
import { StyleSheet } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { useChatViewContext } from "../model";
import { getSectionTitle } from "../utils";
import { ChatText } from "./ChatText";

/**
 * Разделитель дат — он же прилипающая плашка даты.
 *
 * Список прилепляет разделитель к верхней кромке через `stickyHeaderIndices`
 * и сам выталкивает его следующим разделителем. Здесь применяется автоскрытие
 * в покое только к прилипшей строке; строка в потоке всегда видима.
 *
 * Обе величины — shared values, скролл не вызывает ре-рендеров.
 */
interface IDateSeparatorRowProps {
  groupDate: string;
  /** Первый разделитель скрыт, пока сверху крутится спиннер догрузки. */
  hidden: boolean;
  /** Индекс строки: по нему сверяемся с прилипшей. */
  index: number;
}

export const DateSeparatorRow: FC<IDateSeparatorRowProps> = memo(
  ({ groupDate, hidden, index }) => {
    const { styles, stickyDate } = useChatViewContext();

    const { activeIndex, opacity } = stickyDate;

    const rowStyle = useAnimatedStyle(() => {
      if (hidden) return { opacity: 0 };

      return { opacity: activeIndex.value === index ? opacity.value : 1 };
    }, [hidden, index]);

    return (
      <Animated.View style={[ss.row, rowStyle]}>
        <Animated.View style={styles.shared.dateSeparatorPill}>
          <ChatText style={styles.shared.dateSeparatorText}>
            {getSectionTitle(groupDate)}
          </ChatText>
        </Animated.View>
      </Animated.View>
    );
  },
);

DateSeparatorRow.displayName = "DateSeparatorRow";

const ss = StyleSheet.create({
  row: { alignItems: "center", paddingVertical: 6 },
});
