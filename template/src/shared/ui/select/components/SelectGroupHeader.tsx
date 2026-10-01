import { useTheme } from "@shared/lib/theme";
import React, { memo } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../../text";

export interface ISelectGroupHeaderProps {
  label: string;
}

/** Заголовок группы опций; непрозрачный фон — чтобы прилипать поверх строк. */
export const SelectGroupHeader = memo(({ label }: ISelectGroupHeaderProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.surface }]}>
      <Text textStyle={"Caption_M3"} color={"textSecondary"}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 4,
  },
});
