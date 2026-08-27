import React, { ComponentType, memo, useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { useListSignals } from "../hooks";
import { POSITION_OUT_OF_VIEW, useListRuntime } from "../model";
import type { IListRenderItemProps } from "../types";
import { getContainerSignalNames } from "./container-signals";
import type { IListItemContentProps } from "./ListItemContent";
import { ListItemContent } from "./ListItemContent";
import { ListStickyFrame } from "./ListStickyFrame";

interface IListItemContainerProps {
  id: number;
  renderItem: (props: IListRenderItemProps<unknown>) => React.ReactNode;
  extraData: unknown;
  ItemSeparatorComponent?: ComponentType<unknown> | null;
}

/** Адресный контейнер; обычная строка не создаёт Reanimated mapper-ы. */
export const ListItemContainer = memo<IListItemContainerProps>(
  ({ id, renderItem, extraData, ItemSeparatorComponent }) => {
    const runtime = useListRuntime();
    const signalNames = useMemo(() => getContainerSignalNames(id), [id]);
    const [
      position,
      itemKey,
      itemIndex,
      itemData,
      itemType,
      itemSize,
      stickyEdge,
      stickyLimit,
      clipped,
      scrollLength,
    ] = useListSignals(signalNames);

    const resolvedPosition = position ?? POSITION_OUT_OF_VIEW;
    const resolvedSize = itemSize ?? 0;
    const resolvedScrollLength = scrollLength ?? 0;

    if (itemKey === undefined || itemIndex === undefined) return null;

    const resolvedItemType = itemType ?? "";
    const contentProps: IListItemContentProps = {
      id,
      itemKey,
      itemIndex,
      itemData,
      itemType: resolvedItemType,
      renderItem,
      extraData,
      ItemSeparatorComponent,
    };
    const contentKey = runtime.shouldRecycleItems()
      ? resolvedItemType
      : itemKey;

    if (stickyEdge) {
      return (
        <ListStickyFrame
          edge={stickyEdge}
          position={resolvedPosition}
          size={resolvedSize}
          scrollLength={resolvedScrollLength}
          limit={stickyLimit}
          itemIndex={itemIndex}
          clipped={clipped ?? false}
        >
          {(offset, pinned) => (
            <ListItemContent
              key={contentKey}
              {...contentProps}
              stickyOffset={offset}
              stickyPinned={pinned}
            />
          )}
        </ListStickyFrame>
      );
    }

    const style = [
      styles.container,
      { top: resolvedPosition },
      clipped ? { height: resolvedSize, overflow: "hidden" as const } : null,
    ];

    return (
      <View style={style}>
        <ListItemContent key={contentKey} {...contentProps} />
      </View>
    );
  },
);

ListItemContainer.displayName = "ListItemContainer";

const styles = StyleSheet.create({
  container: {
    left: 0,
    position: "absolute",
    right: 0,
  },
});
