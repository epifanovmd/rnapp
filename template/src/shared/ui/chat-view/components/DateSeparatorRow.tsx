import React, { FC, memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { getSectionTitle } from "../model";
import { useChatViewContext } from "./chat-view-context";

/**
 * Порт DateSeparatorCell + dateSeparatorView: плашка-«пилюля» с датой группы.
 * Первый разделитель скрывается на время isLoadingTop (порт
 * hideFirstDateSeparator).
 */

interface IDateSeparatorRowProps {
  groupDate: string;
  hidden?: boolean;
}

export const DateSeparatorRow: FC<IDateSeparatorRowProps> = memo(
  ({ groupDate, hidden = false }) => {
    const { theme, layout } = useChatViewContext();

    const rowDynamicStyle = {
      paddingVertical: layout.sectionSpacing,
      opacity: hidden ? 0 : 1,
    };

    return (
      <View style={[ss.row, rowDynamicStyle]}>
        <View
          style={{
            borderRadius: layout.dateSeparatorCornerRadius,
            backgroundColor: theme.dateSeparatorBackground,
            paddingVertical: layout.dateSeparatorVPad,
            paddingHorizontal: layout.dateSeparatorHPad,
          }}
        >
          <Text
            style={{
              fontSize: layout.dateSeparatorFont.fontSize,
              fontWeight: layout.dateSeparatorFont.fontWeight,
              color: theme.dateSeparatorText,
            }}
          >
            {getSectionTitle(groupDate)}
          </Text>
        </View>
      </View>
    );
  },
);

DateSeparatorRow.displayName = "DateSeparatorRow";

const ss = StyleSheet.create({
  row: {
    alignItems: "center",
  },
});
