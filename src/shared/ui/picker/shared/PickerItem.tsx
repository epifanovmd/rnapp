import React from "react";

import type { PickerColor, PickerItemValue } from "./types";

export interface PickerItemProps {
  label: string;
  value: PickerItemValue;
  /** Недоступен для выбора: прокрутка соседа упирается в него */
  disabled?: boolean;
  /** Цвет подписи, перекрывает `itemColor` колеса */
  color?: PickerColor;
  testID?: string;
}

/** Декларация элемента: сам не рендерится, читается родительским `Picker`. */
export const PickerItem = (_props: PickerItemProps) => null;

PickerItem.displayName = "PickerItem";
