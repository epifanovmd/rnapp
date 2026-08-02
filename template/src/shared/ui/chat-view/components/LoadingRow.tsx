import React, { FC, memo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/**
 * Спиннер подгрузки (нижний индикатор пагинации).
 */

export const LoadingRow: FC = memo(() => (
  <View style={ss.row}>
    <ActivityIndicator size="small" />
  </View>
));

LoadingRow.displayName = "LoadingRow";

const ss = StyleSheet.create({
  row: {
    height: 40,
    marginVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});
