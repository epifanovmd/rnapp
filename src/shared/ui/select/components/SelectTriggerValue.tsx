import React, { ReactNode } from "react";

import { Text } from "../../text";
import type { SelectValue, TagRenderInfo, ValueRenderInfo } from "../types";
import { SelectTags } from "./SelectTags";

export interface ISelectTriggerValueProps<V extends SelectValue> {
  /** Теги вместо текста (multi с `tagsDisplay`). */
  tags: boolean;
  placeholder?: string;
  disabled?: boolean;
  values: V[];
  labels: string[];
  renderValue?: (info: ValueRenderInfo<V>) => ReactNode;
  tagRender?: (info: TagRenderInfo<V>) => ReactNode;
  maxTagCount?: number;
  onRemoveTag: (value: V) => void;
}

/** Значение в поле: теги, свой узел `renderValue`, текст или placeholder. */
export const SelectTriggerValue = <V extends SelectValue>({
  tags,
  placeholder,
  disabled,
  values,
  labels,
  renderValue,
  tagRender,
  maxTagCount,
  onRemoveTag,
}: ISelectTriggerValueProps<V>) => {
  const hasValue = values.length > 0;

  if (!hasValue) {
    return (
      <Text textStyle={"Body_M2"} color={"textTertiary"} numberOfLines={1}>
        {placeholder}
      </Text>
    );
  }

  if (tags) {
    return (
      <SelectTags<V>
        values={values}
        labels={labels}
        disabled={disabled}
        maxTagCount={maxTagCount}
        tagRender={tagRender}
        onRemoveTag={onRemoveTag}
      />
    );
  }

  const custom = renderValue?.({ values, labels });

  if (custom != null && typeof custom !== "string") return <>{custom}</>;

  return (
    <Text textStyle={"Body_M2"} numberOfLines={1}>
      {custom ?? labels.join(", ")}
    </Text>
  );
};
