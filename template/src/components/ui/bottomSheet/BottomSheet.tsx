import { BottomSheetModal, BottomSheetModalProps } from "@gorhom/bottom-sheet";
import React, { forwardRef, memo, PropsWithChildren } from "react";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { BottomSheetBackdrop } from "./BottomSheetBackdrop";
import { useBottomSheetStyles } from "./hooks";

export type BottomSheetProps = BottomSheetModalProps;
export type BottomSheet = BottomSheetModal;

export const BottomSheet = memo(
  forwardRef<BottomSheetModal, PropsWithChildren<BottomSheetProps>>(
    (props, ref) => {
      const modalStyles = useBottomSheetStyles();
      const { top } = useSafeAreaInsets();

      return (
        <BottomSheetModal
          ref={ref}
          {...modalStyles}
          topInset={top}
          keyboardBlurBehavior={"restore"}
          backdropComponent={BottomSheetBackdrop}
          {...props}
        >
          {props.children}
          <SafeAreaView edges={["bottom"]} />
        </BottomSheetModal>
      );
    },
  ),
);
