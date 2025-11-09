import { useMergedCallback } from "@common";
import { createSlot, useSlotProps } from "@force-dev/react";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import React, { forwardRef, memo, PropsWithChildren, useCallback } from "react";
import haptic from "react-native-haptic-feedback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheetBackdrop } from "./BottomSheetBackdrop";
import { BottomSheetContent } from "./BottomSheetContent";
import { BottomSheetFooter } from "./BottomSheetFooter";
import { useBottomSheetStyles } from "./hooks";
import { BottomSheetStyles } from "./styles";
import {
  TBottomSheetContentProps,
  TBottomSheetHeaderProps,
  TBottomSheetProps,
} from "./types";

const Header = createSlot<TBottomSheetHeaderProps>("Header");
const Content = createSlot<TBottomSheetContentProps>("Content");
const Footer = BottomSheetFooter;

export type BottomSheet = BottomSheetModal;

const _BottomSheet = memo(
  forwardRef<BottomSheetModal, PropsWithChildren<TBottomSheetProps>>(
    ({ haptic: hapticEnable, ...props }, ref) => {
      const modalStyles = useBottomSheetStyles();
      const { top } = useSafeAreaInsets();
      const { header, content, footer } = useSlotProps(
        BottomSheet,
        props.children,
      );

      const animateWithHaptic = useCallback(
        (fromIndex: number) => {
          if (fromIndex === -1 && hapticEnable) {
            haptic.trigger();
          }
        },
        [hapticEnable],
      );

      const onAnimate = useMergedCallback(props.onAnimate, animateWithHaptic);

      return (
        <BottomSheetModal
          ref={ref}
          {...modalStyles}
          topInset={top}
          keyboardBlurBehavior={"restore"}
          backdropComponent={BottomSheetBackdrop}
          {...props}
          onAnimate={onAnimate}
          style={[BottomSheetStyles.container, props.style]}
        >
          <BottomSheetContent
            header={header}
            footer={footer}
            bounces={false}
            {...content}
          />
        </BottomSheetModal>
      );
    },
  ),
);

export const BottomSheet = Object.assign(_BottomSheet, {
  Header,
  Content,
  Footer,
});
