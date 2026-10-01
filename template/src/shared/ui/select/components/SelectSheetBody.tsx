import { useEvent } from "@shared/lib/hooks";
import React, { ReactNode, useRef } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { GestureType } from "react-native-gesture-handler";

import { TBottomSheetContentProps } from "../../bottom-sheet";
import type { SelectValue } from "../types";
import { hasListContent, ISelectListModel } from "./select-list-model";
import { SelectOptionsList } from "./SelectOptionsList";
import { SelectVirtualList } from "./SelectVirtualList";

export interface ISelectSheetBodyProps<V extends SelectValue> {
  model: ISelectListModel<V>;
  /** Шапка над списком (поиск, поле ввода) — не скроллится. */
  top?: ReactNode;
  /** Слитые пропсы контент-слота шторки, в т.ч. замер высоты. */
  contentProps: Partial<TBottomSheetContentProps>;
  gesture: GestureType;
  maxHeight: number;
}

const GAP = 8;

/**
 * Тело шторки: шапка над списком и список (обычный или виртуальный). Шторке
 * сообщается естественная высота — шапка плюс контент списка, — а не
 * сжатая рамка: иначе dynamic sizing залипает на промежуточной высоте.
 */
export const SelectSheetBody = <V extends SelectValue>({
  model,
  top,
  contentProps,
  gesture,
  maxHeight,
}: ISelectSheetBodyProps<V>) => {
  const {
    onContentSizeChange,
    children: _children,
    ...scrollProps
  } = contentProps;
  const sizesRef = useRef({ top: 0, list: -1 });
  const hasTop = top != null;

  const report = useEvent(() => {
    const { top: topHeight, list } = sizesRef.current;

    if (list < 0) return;
    if (typeof onContentSizeChange === "function") {
      onContentSizeChange(0, list + (hasTop ? topHeight + GAP : 0));
    }
  });

  const handleTopLayout = useEvent((event: LayoutChangeEvent) => {
    sizesRef.current.top = event.nativeEvent.layout.height;
    report();
  });

  const handleListHeight = useEvent((height: number) => {
    sizesRef.current.list = height;
    report();
  });

  const virtual = model.virtual && hasListContent(model) ? model.virtual : null;

  return (
    <View style={styles.body}>
      {hasTop && <View onLayout={handleTopLayout}>{top}</View>}
      {virtual ? (
        <SelectVirtualList<V>
          model={model}
          config={virtual}
          gesture={gesture}
          maxHeight={maxHeight}
          onContentHeight={handleListHeight}
        />
      ) : (
        <SelectOptionsList<V>
          model={model}
          scrollProps={scrollProps}
          onContentHeight={handleListHeight}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  body: {
    flexShrink: 1,
    gap: GAP,
  },
});
