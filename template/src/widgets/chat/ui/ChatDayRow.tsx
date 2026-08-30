import { MessageDayDivider } from "@entities/message";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import { formatChatDay } from "../model/chat-day";
import { CHAT_DAY_ROW_HEIGHT } from "../model/chat-rows";

export interface IChatDayRowProps {
  dayKey: string;
}

/**
 * Строка-разделитель даты.
 *
 * Высота фиксирована и объявлена списку через `chatRowFixedSize`: измерять
 * такие строки нечего, а прилипание считает по ней место у верхней кромки.
 */
export const ChatDayRow: FC<IChatDayRowProps> = memo(({ dayKey }) => (
  <View style={ss.row}>
    <MessageDayDivider title={formatChatDay(dayKey)} />
  </View>
));

ChatDayRow.displayName = "ChatDayRow";

const ss = StyleSheet.create({
  row: {
    alignItems: "center",
    height: CHAT_DAY_ROW_HEIGHT,
    justifyContent: "center",
  },
});
