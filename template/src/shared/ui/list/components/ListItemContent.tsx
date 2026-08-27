import React, {
  ComponentType,
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import { LayoutChangeEvent, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";

import { useListRuntime } from "../model";
import type { IListRenderItemProps } from "../types";

export interface IListItemContentProps {
  id: number;
  itemKey: string;
  itemIndex: number;
  itemData: unknown;
  itemType: string;
  renderItem: (props: IListRenderItemProps<unknown>) => React.ReactNode;
  extraData: unknown;
  ItemSeparatorComponent?: ComponentType<unknown> | null;
  stickyOffset?: SharedValue<number>;
  stickyPinned?: SharedValue<boolean>;
}

/**
 * Перерабатываемое содержимое ячейки. `onLayout` служит только триггером:
 * высота перечитывается после коммита и принимается лишь пока контейнер всё ещё
 * привязан к этому ключу. Запоздавший layout старой строки не портит новую.
 */
export const ListItemContent = memo<IListItemContentProps>(
  ({
    id,
    itemKey,
    itemIndex,
    itemData,
    itemType,
    renderItem,
    extraData,
    ItemSeparatorComponent,
    stickyOffset,
    stickyPinned,
  }) => {
    const runtime = useListRuntime();
    const contentRef = useRef<View>(null);
    const measureRequest = useRef(0);
    const fixedSize = runtime.isItemSizeFixed(itemKey);

    const measureCurrentContent = useCallback(() => {
      if (fixedSize) return;
      const request = ++measureRequest.current;

      // `measure` из layout effect читает уже закоммиченный нативный узел и не
      // добавляет ещё один кадр ожидания перед пересчётом виртуализации.
      contentRef.current?.measure((_x, _y, _width, height) => {
        if (request !== measureRequest.current) return;

        runtime.setContainerItemSize(id, itemKey, height);
      });
    }, [fixedSize, id, itemKey, runtime]);

    // При перепривязке с той же высотой `onLayout` может не прийти.
    useLayoutEffect(measureCurrentContent, [measureCurrentContent, itemData]);

    useEffect(
      () => () => {
        measureRequest.current++;
      },
      [],
    );

    const handleLayout = useCallback(
      (_event: LayoutChangeEvent) => measureCurrentContent(),
      [measureCurrentContent],
    );

    return (
      <View
        ref={contentRef}
        onLayout={fixedSize ? undefined : handleLayout}
        collapsable={false}
      >
        {renderItem({
          item: itemData,
          index: itemIndex,
          type: itemType,
          extraData,
          stickyOffset,
          stickyPinned,
        })}
        {ItemSeparatorComponent ? <ItemSeparatorComponent /> : null}
      </View>
    );
  },
);

ListItemContent.displayName = "ListItemContent";
