import { BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useMergedCallback } from "@shared/lib/hooks";
import React, { useCallback } from "react";
import haptic from "react-native-haptic-feedback";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { BottomSheetBackdrop } from "./BottomSheetBackdrop";
import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";
import { BottomSheetLayout } from "./BottomSheetLayout";
import { useBottomSheetStyles } from "./hooks";
import { BottomSheetStyles } from "./styles";
import { TBottomSheetProps } from "./types";

const bottomSheetSlots = {
  header: slot.of(BottomSheetHeader),
  content: slot.of(BottomSheetScrollView, {
    always: true,
    defaultProps: { bounces: false },
  }),
  footer: slot.of(BottomSheetFooter),
};

export type BottomSheet = BottomSheetModal;

const BottomSheetRoot = ({
  props,
  slots,
  content,
  forwardedRef,
}: CompoundRootProps<
  TBottomSheetProps,
  typeof bottomSheetSlots,
  BottomSheetModal
>) => {
  const { haptic: hapticEnable, ...modalProps } = props;
  const modalStyles = useBottomSheetStyles();
  const { top } = useSafeAreaInsets();

  const animateWithHaptic = useCallback(
    (fromIndex: number) => {
      if (fromIndex === -1 && hapticEnable) {
        haptic.trigger();
      }
    },
    [hapticEnable],
  );

  const onAnimate = useMergedCallback(modalProps.onAnimate, animateWithHaptic);

  return (
    <BottomSheetModal
      ref={forwardedRef}
      {...modalStyles}
      topInset={top}
      keyboardBlurBehavior={"restore"}
      backdropComponent={BottomSheetBackdrop}
      {...modalProps}
      stackBehavior={"replace"}
      onAnimate={onAnimate}
      style={[BottomSheetStyles.container, modalProps.style]}
    >
      <BottomSheetLayout
        header={slots.header}
        content={slots.content}
        footer={slots.footer}
      >
        {content}
      </BottomSheetLayout>
    </BottomSheetModal>
  );
};

export const BottomSheet = createCompound<
  TBottomSheetProps,
  BottomSheetModal
>()({
  name: "BottomSheet",
  render: BottomSheetRoot,
  slots: bottomSheetSlots,
});
