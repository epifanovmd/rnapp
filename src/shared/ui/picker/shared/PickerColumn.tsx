import React, { ReactElement } from "react";

import type { PickerItemProps } from "./PickerItem";
import type {
  PickerAppearance,
  PickerChangeItem,
  PickerItemPressEvent,
  PickerItemValue,
  PickerScrollEvent,
  PickerScrollStateEvent,
} from "./types";

type PickerColumnChild = ReactElement<PickerItemProps>;

export interface PickerColumnProps extends PickerAppearance {
  /** Фиксированная ширина колонки, dp. Без неё колонки делят ширину поровну */
  width?: number;
  selectedValue?: PickerItemValue;
  onChange?: (item: PickerChangeItem) => void;
  onScrollStateChange?: (event: PickerScrollStateEvent) => void;
  onScroll?: (event: PickerScrollEvent) => void;
  onItemPress?: (event: PickerItemPressEvent) => void;
  children: PickerColumnChild | PickerColumnChild[];
}

/** Декларация колонки: сама не рендерится, читается родительским `Picker`. */
export const PickerColumn = (_props: PickerColumnProps) => null;

PickerColumn.displayName = "PickerColumn";
