import { Text } from "@shared/ui";
import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

interface ILabPerfRowProps {
  label: string;
  value: string;
}

/** Строка панели счётчиков: подпись слева, значение справа. */
export const LabPerfRow: FC<ILabPerfRowProps> = memo(({ label, value }) => (
  <View style={ss.row}>
    <Text textStyle={"Caption_M2"} color={"textSecondary"}>
      {label}
    </Text>
    <Text textStyle={"Caption_M1"}>{value}</Text>
  </View>
));

LabPerfRow.displayName = "LabPerfRow";

const ss = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 1,
  },
});
