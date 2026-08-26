import React, { memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useListSignal } from "../hooks";

/**
 * Смещение, на которое отодвинута распорка.
 *
 * Компенсация бывает и отрицательной, а позиция распорки обязана оставаться
 * положительной — иначе нативное удержание перестаёт её видеть.
 */
const ADJUST_BIAS = 10000000;

/**
 * Якорь компенсации позиции.
 *
 * Первый ребёнок контента и нулевой размер: нативное удержание позиции
 * (`minIndexForVisible: 0`) следит именно за ним. Сдвиг его кадра нативный
 * скролл повторяет на `contentOffset` изнутри — в отличие от программного
 * скролла это не обрывает ни жест, ни инерцию.
 */
export const ListScrollAdjust = memo(() => {
  const adjust = useListSignal("scrollAdjust") ?? 0;
  const style = useMemo(
    () => [styles.anchor, { top: adjust + ADJUST_BIAS }],
    [adjust],
  );

  return <View style={style} pointerEvents={"none"} />;
});

ListScrollAdjust.displayName = "ListScrollAdjust";

const styles = StyleSheet.create({
  anchor: {
    height: 0,
    left: 0,
    position: "absolute",
    width: 0,
  },
});
