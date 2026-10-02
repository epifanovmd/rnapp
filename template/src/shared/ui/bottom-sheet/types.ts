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
  /**
   * При закрытии клавиатуры вернуть скролл к положению на момент её открытия.
   * В шторке по умолчанию `false`: пока шторка gorhom опускается, её скролл
   * заблокирован, и любой scrollTo gorhom сбрасывает в начало (onScroll в
   * LOCKED) — возврат дёргал бы контент.
   */
  restoreScrollOnKeyboardHide?: boolean;
};
export type TBottomSheetFooterProps = ComponentProps<typeof BottomSheetFooter>;
