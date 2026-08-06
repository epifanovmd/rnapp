import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMergedCallback } from "@shared/lib/hooks";
import React, { memo, useCallback } from "react";
import haptic from "react-native-haptic-feedback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { BottomSheetBackdrop } from "./BottomSheetBackdrop";
import { BottomSheetFooter, BottomSheetFooterProps } from "./BottomSheetFooter";
import { BottomSheetScrollView } from "./BottomSheetScrollView";
import { useBottomSheetStyles } from "./hooks";
import { BottomSheetStyles } from "./styles";
import {
  TBottomSheetContentProps,
  TBottomSheetHeaderProps,
  TBottomSheetProps,
} from "./types";

const bottomSheetSlots = {
  header: slot<TBottomSheetHeaderProps>(),
  content: slot<TBottomSheetContentProps>(),
  footer: slot<BottomSheetFooterProps>(),
};

export type BottomSheet = BottomSheetModal;

const BottomSheetRoot = memo(
  ({
    props,
    slots,
    forwardedRef,
  }: CompoundRootProps<
    TBottomSheetProps,
    BottomSheetModal,
    typeof bottomSheetSlots
  >) => {
    const { haptic: hapticEnable, ...modalProps } = props;
    const modalStyles = useBottomSheetStyles();
    const { top } = useSafeAreaInsets();
    const { header, content, footer } = slots;

    const animateWithHaptic = useCallback(
      (fromIndex: number) => {
        if (fromIndex === -1 && hapticEnable) {
          haptic.trigger();
        }
      },
      [hapticEnable],
    );

    const onAnimate = useMergedCallback(
      modalProps.onAnimate,
      animateWithHaptic,
    );

    return (
      <BottomSheetModal
        ref={forwardedRef}
        {...modalStyles}
        topInset={top}
        keyboardBlurBehavior={"restore"}
        backdropComponent={BottomSheetBackdrop}
        {...modalProps}
        onAnimate={onAnimate}
        style={[BottomSheetStyles.container, modalProps.style]}
      >
        <BottomSheetScrollView
          bounces={false}
          header={header.props}
          footer={footer.props}
          {...content.props}
          children={content.props?.children}
        />
      </BottomSheetModal>
    );
  },
);

const BottomSheetCompound = createCompound<
  TBottomSheetProps,
  BottomSheetModal
>()({
  name: "BottomSheet",
  render: BottomSheetRoot,
  slots: bottomSheetSlots,
});

export const BottomSheet = Object.assign(BottomSheetCompound, {
  Footer: Object.assign(BottomSheetCompound.Footer, {
    PrimaryButton: BottomSheetFooter.PrimaryButton,
    SecondaryButton: BottomSheetFooter.SecondaryButton,
  }),
});
