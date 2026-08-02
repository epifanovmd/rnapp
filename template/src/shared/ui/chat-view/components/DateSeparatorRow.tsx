import React, { FC, memo, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getSectionTitle } from "../utils";
import { useChatViewContext } from "./chat-view-context";

/**
 * Разделитель дат. Первый скрывается на время `isLoadingTop`.
 */

interface IDateSeparatorRowProps {
  groupDate: string;
  hidden: boolean;
}

export const DateSeparatorRow: FC<IDateSeparatorRowProps> = memo(
  ({ groupDate, hidden }) => {
    const { layout, styles } = useChatViewContext();

    const rowStyle = useMemo(
      () => [
        ss.row,
        { paddingVertical: layout.sectionSpacing, opacity: hidden ? 0 : 1 },
      ],
      [layout.sectionSpacing, hidden],
    );

    return (
      <View style={rowStyle}>
        <View style={styles.shared.dateSeparatorPill}>
          <Text style={styles.shared.dateSeparatorText}>
            {getSectionTitle(groupDate)}
          </Text>
        </View>
      </View>
    );
  },
);

DateSeparatorRow.displayName = "DateSeparatorRow";

const ss = StyleSheet.create({
  row: { alignItems: "center" },
});
