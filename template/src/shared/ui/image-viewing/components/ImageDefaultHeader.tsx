import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  onRequestClose: () => void;
};

const HIT_SLOP = { top: 16, left: 16, bottom: 16, right: 16 };
const TOP_EDGE = ["top"] as const;

export const ImageDefaultHeader = ({ onRequestClose }: Props) => (
  <SafeAreaView edges={TOP_EDGE} style={styles.root}>
    <TouchableOpacity
      style={styles.closeButton}
      onPress={onRequestClose}
      hitSlop={HIT_SLOP}
    >
      <Text style={styles.closeText}>✕</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  root: {
    alignItems: "flex-end",
  },
  closeButton: {
    marginRight: 8,
    marginTop: 8,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#00000077",
  },
  closeText: {
    lineHeight: 22,
    fontSize: 19,
    textAlign: "center",
    color: "#FFF",
    includeFontPadding: false,
  },
});
