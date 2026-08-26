import { useTheme } from "@shared/lib/theme";
import { Avatar, Spinner, Text } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { LabRow } from "../model";
import { MESSAGE_GAP } from "../model";
import { DATE_ROW_HEIGHT, LOADER_ROW_HEIGHT } from "../model";

interface ILabRowViewProps {
  row: LabRow;
  /** Индекс строки в списке — для отладочной разметки. */
  index?: number;
  /** Рисовать ли аватар у хвоста группы — стенд прилипания включает его. */
  withAvatar?: boolean;
  /** Смещение прилипания от списка: применяется только к аватару. */
  stickyOffset?: SharedValue<number>;
}

/** Строка тестового списка: сообщение, разделитель даты или спиннер. */
export const LabRowView: FC<ILabRowViewProps> = memo(
  ({ row, index, withAvatar = false, stickyOffset }) => {
    const { isDark } = useTheme();

    const avatarStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: stickyOffset?.value ?? 0 }],
    }));

    if (row.type === "loader") {
      return (
        <View style={[ss.loader, { height: LOADER_ROW_HEIGHT }]}>
          <Spinner />
          <Text textStyle={"Caption_M2"} color={"textSecondary"} ml={8}>
            {row.edge === "start" ? "Грузим старые…" : "Грузим новые…"}
          </Text>
        </View>
      );
    }

    if (row.type === "date") {
      return (
        <View style={[ss.dateRow, { height: DATE_ROW_HEIGHT }]}>
          <View
            style={[ss.datePill, isDark ? ss.datePillDark : ss.datePillLight]}
          >
            <Text textStyle={"Caption_M2"}>{row.day}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[ss.message, { height: row.height }]}>
        {withAvatar && (
          <View style={ss.avatarSlot}>
            {row.isGroupTail && (
              <Animated.View style={avatarStyle}>
                <Avatar size={36} name={row.author} />
              </Animated.View>
            )}
          </View>
        )}
        <View style={[ss.bubble, isDark ? ss.bubbleDark : ss.bubbleLight]}>
          <Text textStyle={"Caption_M2"} color={"textSecondary"}>
            {`${row.author} · ${row.day}`}
          </Text>
          <Text textStyle={"Body_M1"}>{row.text}</Text>
        </View>
      </View>
    );
  },
);

LabRowView.displayName = "LabRowView";

const ss = StyleSheet.create({
  // Слот повторяет вертикальные границы пузыря: тот же отступ сверху, низ по
  // низу строки. Так видимые края группы совпадают с теми, по которым список
  // ограничивает ход аватара.
  avatarSlot: { justifyContent: "flex-end", marginTop: MESSAGE_GAP, width: 44 },
  // Зазор между сообщениями — отступ сверху пузыря: низ пузыря совпадает с
  // низом строки, поэтому аватар садится ровно на него.
  bubble: {
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
    marginTop: MESSAGE_GAP,
    padding: 10,
  },
  bubbleDark: { backgroundColor: "#2A2F36" },
  bubbleLight: { backgroundColor: "#EEF1F5" },
  datePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  datePillDark: { backgroundColor: "#3A4048" },
  datePillLight: { backgroundColor: "#DDE3EA" },
  dateRow: { alignItems: "center", justifyContent: "center" },
  loader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  // Без вертикальных отступов: список считает границы группы по краям строк, и
  // любой зазор здесь разводит их с видимыми краями сообщений.
  message: { flexDirection: "row", paddingHorizontal: 12 },
});
