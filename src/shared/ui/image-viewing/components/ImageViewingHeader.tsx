import React, { FC, memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IImageViewingBarInfo } from "../image-viewing.types";

const HIT_SLOP = { top: 16, left: 16, bottom: 16, right: 16 };

/**
 * Дефолтная шапка: счётчик по центру, кнопка закрытия справа.
 * Safe-area-отступ даёт контейнер бара в ImageViewing.
 */
export const ImageViewingHeader: FC<IImageViewingBarInfo> = memo(
  ({ index, count, onClose }) => (
    <View style={styles.row}>
      <View style={styles.side} />
      {count > 1 && (
        <Text style={styles.counter}>{`${index + 1} / ${count}`}</Text>
      )}
      <View style={styles.side}>
        <TouchableOpacity
          accessibilityRole={"button"}
          accessibilityLabel={"Закрыть"}
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={HIT_SLOP}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  ),
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  side: {
    width: 44,
    alignItems: "flex-end",
  },
  counter: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "#00000077",
  },
  closeText: {
    fontSize: 19,
    lineHeight: 22,
    color: "#FFFFFF",
    includeFontPadding: false,
  },
});
