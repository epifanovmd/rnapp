import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMergedCallback } from "@shared/lib/hooks";
import React, { useCallback, useMemo } from "react";
import haptic from "react-native-haptic-feedback";
import { KeyboardController } from "react-native-keyboard-controller";
import { useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CompoundRootProps, createCompound, slot } from "../../lib/slots";
import { BottomSheetBackdrop } from "./BottomSheetBackdrop";
import { BottomSheetFooter } from "./BottomSheetFooter";
import { BottomSheetHeader } from "./BottomSheetHeader";
import { BottomSheetLayout } from "./BottomSheetLayout";
import { BottomSheetScrollContent } from "./BottomSheetScrollContent";
import { createKeyboardShiftContainer } from "./createKeyboardShiftContainer";
import { useBottomSheetStyles } from "./hooks";
import { isSheetClosing, isSheetOpening } from "./sheet-keyboard-layout";
import { BottomSheetStyles } from "./styles";
import { TBottomSheetProps } from "./types";

const bottomSheetSlots = {
  header: slot.of(BottomSheetHeader),
  content: slot.of(BottomSheetScrollContent, {
    always: true,
    defaultProps: { bounces: false, keyboardShouldPersistTaps: "handled" },
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
  const {
    haptic: hapticEnable,
    nested,
    dismissKeyboardOnOpen,
    ...modalProps
  } = props;
  const modalStyles = useBottomSheetStyles();
  const { top } = useSafeAreaInsets();
  // Над клавиатурой шторку двигаем сами (BottomSheetLayout), gorhom о ней
  // не знает: поля не сообщают ему target.
  const keyboardShift = useSharedValue(0);
  const containerComponent = useMemo(
    () => createKeyboardShiftContainer(keyboardShift),
    [keyboardShift],
  );

  const animateWithHaptic = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === -1 && hapticEnable) {
        haptic.trigger();
      }
      if (
        isSheetClosing(fromIndex, toIndex) ||
        (dismissKeyboardOnOpen && isSheetOpening(fromIndex, toIndex))
      ) {
        KeyboardController.dismiss();
      }
    },
    [hapticEnable, dismissKeyboardOnOpen],
  );

  const onAnimate = useMergedCallback(modalProps.onAnimate, animateWithHaptic);

  return (
    <BottomSheetModal
      ref={forwardedRef}
      {...modalStyles}
      topInset={top}
      keyboardBlurBehavior={"none"}
      backdropComponent={BottomSheetBackdrop}
      containerComponent={containerComponent}
      {...modalProps}
      stackBehavior={nested ? "push" : "replace"}
      onAnimate={onAnimate}
      style={[BottomSheetStyles.container, modalProps.style]}
    >
      <BottomSheetLayout
        header={slots.header}
        content={slots.content}
        footer={slots.footer}
        keyboardShift={keyboardShift}
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
