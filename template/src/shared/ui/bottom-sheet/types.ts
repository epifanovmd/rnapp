import {
  BottomSheetModalProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ComponentProps } from "react";
import { SharedValue } from "react-native-reanimated";

import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";

/**
 * `stackBehavior` не пробрасывается: лист закрывает предыдущий (`replace`).
 * Исключение — `nested`: лист, открываемый из другого листа (выбор значения
 * в форме), открывается поверх (`push`): родитель остаётся на экране и не
 * размонтируется вместе с вложенным листом.
 */
export type TBottomSheetProps = Omit<BottomSheetModalProps, "stackBehavior"> & {
  haptic?: boolean;
  nested?: boolean;
};
export type TBottomSheetHeaderProps = ComponentProps<typeof BottomSheetHeader>;
export type TBottomSheetContentProps = ComponentProps<
  typeof BottomSheetScrollView
> & {
  /** От низа скролла до клавиатуры при открытой клавиатуре; ставит BottomSheetLayout. */
  keyboardBottomInset?: SharedValue<number>;
};
export type TBottomSheetFooterProps = ComponentProps<typeof BottomSheetFooter>;
