import React, { FC, memo } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const SPINNER_HEIGHT = 40;
const SPINNER_MARGIN = 8;

export const LOADING_ROW_HEIGHT = SPINNER_HEIGHT + SPINNER_MARGIN * 2;

export const LoadingRow: FC = memo(() => (
  <View style={ss.row}>
    <ActivityIndicator size="small" />
  </View>
));

LoadingRow.displayName = "LoadingRow";

const ss = StyleSheet.create({
  row: {
    height: SPINNER_HEIGHT,
    marginVertical: SPINNER_MARGIN,
    alignItems: "center",
    justifyContent: "center",
  },
});
