import { useIsVisibleKeyboard, useModalStyles } from "@common";
import { createSlot, mergeRefs, useSlotProps } from "@force-dev/react";
import {
  BottomSheetView,
  SafeArea,
  useModalRef,
} from "@force-dev/react-mobile";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import React, {
  FC,
  forwardRef,
  memo,
  PropsWithChildren,
  RefAttributes,
  useCallback,
} from "react";
import { ColorValue, GestureResponderEvent } from "react-native";

import { CloseIcon } from "../../icons";
import { Field, FieldProps, FieldSlots } from "../field";
import { ModalActions, ModalActionsProps } from "../modal";
import {
  Modal,
  ModalHeader as _ModalHeader,
  ModalHeaderProps,
  ModalProps,
} from "../modal";
import { ScrollViewProps } from "../scrollView";

export interface ModalFieldProps extends FieldProps {}

type ModalPropsWithRenderClose = ModalProps & {
  renderCloseIcon?: (fill?: ColorValue) => React.JSX.Element | null;
};

const ModalSlot = createSlot<ModalPropsWithRenderClose>("Modal");
const ModalScrollView = createSlot<ScrollViewProps>("ModalScrollView");
const ModalHeader = createSlot<ModalHeaderProps>("ModalHeader");
const ModalFooter = createSlot<ModalActionsProps>("ModalFooter");

export interface ModalFieldSlots extends FieldSlots {
  Modal: typeof ModalSlot;
  ModalScrollView: typeof ModalScrollView;
  ModalHeader: typeof ModalHeader;
  ModalFooter: typeof ModalFooter;
}

const _ModalField: FC<
  PropsWithChildren<ModalFieldProps & RefAttributes<Modal>>
> = memo(
  forwardRef(({ children, onPress, ...rest }, ref) => {
    const {
      modal,
      modalScrollView,
      modalHeader,
      modalFooter,
      leftIcon,
      label,
      content,
      contentValue,
      rightIcon,
      description,
      error,
    } = useSlotProps(ModalField, children);

    const modalRef = useModalRef();
    const modalStyles = useModalStyles();
    const keyboardVisible = useIsVisibleKeyboard();

    const openModal = useCallback(() => {
      modalRef.current?.present();
    }, [modalRef]);

    const handlePress = useCallback(
      (value: any, e: GestureResponderEvent) => {
        openModal();
        onPress?.(value, e);
      },
      [onPress, openModal],
    );

    const onRequestClose = useCallback(() => {
      modalHeader?.onClose?.();
      modalRef.current?.close();
    }, [modalHeader, modalRef]);

    const closeIcon = useCallback(
      (fill?: ColorValue) =>
        (
          modalHeader?.renderCloseIcon ??
          modal?.renderCloseIcon ??
          _renderCloseIcon
        )(fill ?? modalHeader?.color ?? "#fff"),
      [
        modal?.renderCloseIcon,
        modalHeader?.color,
        modalHeader?.renderCloseIcon,
      ],
    );

    return (
      <>
        <Field {...rest} onPress={handlePress}>
          <Field.Label {...label} />
          <Field.LeftIcon {...leftIcon} />
          <Field.Content {...content} />
          <Field.ContentValue {...contentValue} />
          <Field.RightIcon {...rightIcon} />
          <Field.Error color={"red"} {...error} />
          <Field.Description {...description} />
        </Field>
        <Modal ref={mergeRefs([modalRef, ref])} {...modalStyles} {...modal}>
          <BottomSheetView>
            <_ModalHeader
              {...modalHeader}
              label={modalHeader?.label || label?.text}
              textStyle={[modalHeader?.textStyle]}
              renderCloseIcon={closeIcon}
              onClose={onRequestClose}
            >
              {modalHeader?.children}
            </_ModalHeader>

            <BottomSheetScrollView
              pa={16}
              bounces={false}
              keyboardShouldPersistTaps={"handled"}
              {...modalScrollView}
            >
              {modal?.children}
            </BottomSheetScrollView>

            {!!modalFooter && <ModalActions {...modalFooter} />}
            {!keyboardVisible && <SafeArea bottom={true} />}
          </BottomSheetView>
        </Modal>
      </>
    );
  }),
);

export const ModalField = _ModalField as typeof _ModalField & ModalFieldSlots;

ModalField.Modal = ModalSlot;
ModalField.ModalScrollView = ModalScrollView;
ModalField.ModalHeader = ModalHeader;
ModalField.ModalFooter = ModalFooter;

ModalField.Label = Field.Label;
ModalField.LeftIcon = Field.LeftIcon;
ModalField.RightIcon = Field.RightIcon;
ModalField.Content = Field.Content;
ModalField.ContentValue = Field.ContentValue;
ModalField.Description = Field.Description;
ModalField.Error = Field.Error;

const _renderCloseIcon = (fill?: ColorValue) => <CloseIcon fill={fill} />;
