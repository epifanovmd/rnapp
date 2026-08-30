import { useTheme } from "@shared/lib/theme";
import { getTextStyle } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

export interface IMessageDayDividerProps {
  /** Готовая подпись дня: «Сегодня», «Вчера», дата. */
  title: string;
}

/**
 * Разделитель даты между сообщениями.
 *
 * Подпись приходит готовой: как группируется переписка по дням — дело списка,
 * а не отдельного сообщения.
 */
export const MessageDayDivider: FC<IMessageDayDividerProps> = memo(
  ({ title }) => {
    const { colors } = useTheme();

    return (
      <View style={[ss.pill, { backgroundColor: colors.onSurface }]}>
        <Text
          style={[getTextStyle("Caption_M2"), { color: colors.textSecondary }]}
        >
          {title}
        </Text>
      </View>
    );
  },
);

MessageDayDivider.displayName = "MessageDayDivider";

const ss = StyleSheet.create({
  pill: {
    alignSelf: "center",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
