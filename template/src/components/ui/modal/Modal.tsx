import {
  BottomSheetHandle,
  BottomSheetHandleProps,
  IModalProps as FDModalProps,
  Modal as FDModal,
  ModalRef as FDModalRef,
} from "@force-dev/react-mobile";
import React, { forwardRef, memo, PropsWithChildren, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useModalStyles } from "~@common";

export type ModalProps = FDModalProps;
export type Modal = FDModalRef;

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
      <FDModal
        ref={ref}
        {...modalStyles}
        topInset={top}
        keyboardBlurBehavior={"restore"}
        handleComponent={handleComponent}
        {...props}
      >
        {props.children}
      </FDModal>
    );
  }),
);
