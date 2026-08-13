import React, { FC, memo } from "react";
import { StyleSheet, View } from "react-native";

import { Spinner } from "../../spinner";

const SPINNER_HEIGHT = 40;
const SPINNER_MARGIN = 8;

export const LOADING_ROW_HEIGHT = SPINNER_HEIGHT + SPINNER_MARGIN * 2;

export const LoadingRow: FC = memo(() => (
  <View style={ss.row}>
    <Spinner size={20} />
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
