import React, { Fragment, ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Text } from "../../text";
import type { SelectValue, TagRenderInfo } from "../types";
import { SelectTag } from "./SelectTag";

export interface ISelectTagsProps<V extends SelectValue> {
  values: V[];
  labels: string[];
  disabled?: boolean;
  maxTagCount?: number;
  tagRender?: (info: TagRenderInfo<V>) => ReactNode;
  onRemoveTag: (value: V) => void;
}

/** Теги выбранных значений с лимитом `maxTagCount` и счётчиком «+N». */
export const SelectTags = <V extends SelectValue>({
  values,
  labels,
  disabled,
  maxTagCount,
  tagRender,
  onRemoveTag,
}: ISelectTagsProps<V>) => {
  const visibleCount =
    maxTagCount != null && values.length > maxTagCount
      ? maxTagCount
      : values.length;
  const overflowCount = values.length - visibleCount;

  const renderTag = (value: V, index: number) => {
    const label = labels[index] ?? String(value);
    const onRemove = () => onRemoveTag(value);

    if (tagRender) {
      return (
        <Fragment key={String(value)}>
          {tagRender({ value, label, disabled: !!disabled, onRemove })}
        </Fragment>
      );
    }

    return (
      <SelectTag
        key={String(value)}
        label={label}
        disabled={disabled}
        onRemove={onRemove}
      />
    );
  };

  return (
    <View style={styles.row}>
      {values.slice(0, visibleCount).map(renderTag)}
      {overflowCount > 0 && (
        <Text
          textStyle={"Body_S2"}
          color={"textSecondary"}
          style={styles.overflow}
        >
          {`+${overflowCount}`}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    paddingVertical: 2,
  },
  overflow: {
    paddingHorizontal: 4,
  },
});
