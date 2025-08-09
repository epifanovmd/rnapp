import { useModalStyles } from "@common";
import {
  BottomSheetHandle,
  BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, memo, PropsWithChildren, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModalBackdrop } from "./ModalBg";

export type ModalProps = BottomSheetModalProps;
export type Modal = BottomSheetModal;

export const Modal = memo(
  forwardRef<Modal, PropsWithChildren<ModalProps>>((props, ref) => {
    const modalStyles = useModalStyles();
    const { top } = useSafeAreaInsets();

    const handleComponent = useCallback(
      (handleProps: BottomSheetHandleProps) => (
        <BottomSheetHandle
          {...handleProps}
          style={{ padding: 6 }}
          indicatorStyle={{ width: 50 }}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        {...modalStyles}
        topInset={top}
        keyboardBlurBehavior={"restore"}
        handleComponent={handleComponent}
        backdropComponent={ModalBackdrop}
        {...props}
      >
        {props.children}
      </BottomSheetModal>
    );
  }),
);
