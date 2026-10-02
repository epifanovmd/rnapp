import {
  BottomSheetModalProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { IContainerKeyboardShift } from "@shared/lib/keyboard-aware";
import { ComponentProps } from "react";

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
  /** Подъём и ужатие области контента над клавиатурой; ставит BottomSheetLayout. */
  containerShift?: (keyboardHeight: number) => IContainerKeyboardShift;
  /**
   * При закрытии клавиатуры вернуть скролл к положению на момент её открытия,
   * если пользователь не скроллил сам. По умолчанию `true`.
   */
  restoreScrollOnKeyboardHide?: boolean;
};
export type TBottomSheetFooterProps = ComponentProps<typeof BottomSheetFooter>;
