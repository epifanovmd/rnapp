import {
  BottomSheetModalProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ComponentProps } from "react";

import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";

/**
 * `stackBehavior` не пробрасывается: стек модалок не используется, лист всегда
 * закрывает предыдущий (`replace`).
 */
export type TBottomSheetProps = Omit<BottomSheetModalProps, "stackBehavior"> & {
  haptic?: boolean;
};
export type TBottomSheetHeaderProps = ComponentProps<typeof BottomSheetHeader>;
export type TBottomSheetContentProps = ComponentProps<
  typeof BottomSheetScrollView
>;
export type TBottomSheetFooterProps = ComponentProps<typeof BottomSheetFooter>;
