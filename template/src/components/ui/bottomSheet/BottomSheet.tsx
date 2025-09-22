import { useModalStyles } from "@common";
import {
  BottomSheetHandle,
  BottomSheetHandleProps,
  BottomSheetModal,
  BottomSheetModalProps,
} from "@gorhom/bottom-sheet";
import React, { forwardRef, memo, PropsWithChildren, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BottomSheetBackdrop } from "./BottomSheetBackdrop";

export type BottomSheetProps = BottomSheetModalProps;
export type BottomSheet = BottomSheetModal;

export const BottomSheet = memo(
  forwardRef<BottomSheetModal, PropsWithChildren<BottomSheetProps>>(
    (props, ref) => {
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
          backdropComponent={BottomSheetBackdrop}
          {...props}
        >
          {props.children}
        </BottomSheetModal>
      );
    },
  ),
);
