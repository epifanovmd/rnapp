import {
  BottomSheetModalProps,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { ComponentProps } from "react";

import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";

export type TBottomSheetProps = BottomSheetModalProps & { haptic?: boolean };
export type TBottomSheetHeaderProps = ComponentProps<typeof BottomSheetHeader>;
export type TBottomSheetContentProps = ComponentProps<
  typeof BottomSheetScrollView
>;
export type TBottomSheetFooterProps = ComponentProps<typeof BottomSheetFooter>;
