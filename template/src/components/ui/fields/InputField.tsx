import { createSlot, mergeRefs, useSlotProps } from "@force-dev/react";
import {
  BottomSheetView,
  ModalProps,
  useModalRef,
} from "@force-dev/react-mobile";
import React, {
  FC,
  forwardRef,
  memo,
  PropsWithChildren,
  RefAttributes,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ColorValue,
  GestureResponderEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
} from "react-native";

import { CloseIcon } from "../../icons";
import { Field, FieldProps, FieldSlots } from "../field";
import { Input, InputProps, ModalInput } from "../input";
import { ModalActions } from "../modal";
import { Modal, ModalHeader as _ModalHeader, ModalHeaderProps } from "../modal";
import { ScrollView, ScrollViewProps } from "../scrollView";
import { Text, TextProps } from "../text";

interface InputFieldProps extends FieldProps {}

type ModalPropsWithRenderClose = Partial<ModalProps> & {
  renderCloseIcon?: (fill?: ColorValue) => React.JSX.Element;
};

const InputSlot = createSlot<InputProps>("Input");
const ModalSlot = createSlot<ModalPropsWithRenderClose>("Modal");
const ModalScrollView = createSlot<ScrollViewProps>("ModalScrollView");
const ModalHeader = createSlot<ModalHeaderProps>("ModalHeader");
const ModalLabel = createSlot<TextProps>("ModalLabel");

export interface InputFieldSlots extends FieldSlots {
  Input: typeof InputSlot;
  Modal: typeof ModalSlot;
  ModalScrollView: typeof ModalScrollView;
  ModalHeader: typeof ModalHeader;
  ModalLabel: typeof ModalLabel;
}

const _InputField: FC<
  PropsWithChildren<InputFieldProps & RefAttributes<TextInput>>
> = memo(
  forwardRef(({ children, onPress, ...rest }, ref) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setFocused] = useState(false);

    const {
      input,
      modal,
      modalScrollView,
      modalHeader,
      modalLabel,
      leftIcon,
      label,
      content,
      contentValue,
      rightIcon,
      description,
      error,
    } = useSlotProps(InputField, children);

    const modalRef = useModalRef();

    const handlePress = useCallback(
      (value: any, e: GestureResponderEvent) => {
        setFocused(true);
        inputRef.current?.focus();
        modalRef.current?.present();
        setModalValue(input?.value || "");
        onPress?.(e, value);
      },
      [input?.value, modalRef, onPress],
    );

    const [modalValue, setModalValue] = useState<string>(input?.value || "");

    const onClose = useCallback(() => {
      modal?.onDismiss?.();

      inputRef.current?.blur();
      setModalValue("");
    }, [modal]);

    const onRequestClose = useCallback(() => {
      inputRef.current?.blur();
      modalHeader?.onClose?.();
      modalRef.current?.close();
    }, [modalHeader, modalRef]);

    const mergedRef = useMemo(() => mergeRefs([ref, inputRef]), [ref]);
    const disabled = rest.disabled || input?.disabled;

    const modalLabelStyle = useMemo(
      () => [{ fontSize: 18, color: "#fff" }, modalLabel?.style],
      [modalLabel?.style],
    );

    const closeIcon = useCallback(
      (fill?: ColorValue) =>
        (
          modalHeader?.renderCloseIcon ??
          modal?.renderCloseIcon ??
          _renderCloseIcon
        )(fill ?? StyleSheet.flatten(modalLabel?.style).color ?? "#fff"),
      [modal?.renderCloseIcon, modalHeader?.renderCloseIcon, modalLabel?.style],
    );

    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        input?.onFocus?.(e);
        setFocused(true);
      },
      [input],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        input?.onBlur?.(e);
        setFocused(false);
      },
      [input],
    );

    const onAccept = useCallback(() => {
      input?.onChangeText?.(modalValue);
      onClose();
    }, [input, modalValue, onClose]);

    return (
      <>
        <Field {...rest} onPress={handlePress}>
          <Field.Label {...label} />
          <Field.LeftIcon {...leftIcon} />
          <Field.Content {...content}>
            {!modal
              ? (!!input?.value || isFocused) && (
                  <Input
                    ref={mergedRef}
                    {...input}
                    autoFocus={isFocused && !input?.value}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    pointerEvents={disabled || !!modal ? "none" : undefined}
                    disabled={disabled || !!modal}
                    containerStyle={{
                      width: "100%",
                      padding: 0,
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                  />
                )
              : input?.value && <Text>{input?.value}</Text>}
          </Field.Content>
          <Field.ContentValue {...contentValue} />
          <Field.RightIcon {...rightIcon} />
          <Field.Error color={"red"} {...error} />
          <Field.Description {...description} />
        </Field>
        {!!modal && (
          <Modal ref={modalRef} {...modal} onDismiss={onClose}>
            <BottomSheetView>
              <_ModalHeader
                {...modalHeader}
                label={modalHeader?.label || label?.text}
                textStyle={[modalLabelStyle, modalHeader?.textStyle]}
                renderCloseIcon={closeIcon}
                onClose={onRequestClose}
              >
                {modalHeader?.children}
              </_ModalHeader>
              <ScrollView
                ph={16}
                minHeight={150}
                bounces={false}
                keyboardShouldPersistTaps={"handled"}
                {...modalScrollView}
              >
                <Field onPress={handlePress}>
                  <Field.Content {...content}>
                    <ModalInput
                      ref={mergedRef}
                      {...input}
                      scrollEnabled={false}
                      value={input?.multiline ? undefined : modalValue}
                      defaultValue={!input?.multiline ? undefined : modalValue}
                      onBlur={handleBlur}
                      onChangeText={setModalValue}
                      autoFocus={true}
                    />
                  </Field.Content>
                </Field>

                {modal?.children}
              </ScrollView>
              <ModalActions onReject={onClose} onAccept={onAccept} />
            </BottomSheetView>
          </Modal>
        )}
      </>
    );
  }),
);

export const InputField = _InputField as typeof _InputField & InputFieldSlots;

InputField.Modal = ModalSlot;
InputField.ModalScrollView = ModalScrollView;
InputField.ModalHeader = ModalHeader;
InputField.ModalLabel = ModalLabel;
InputField.Input = InputSlot;

InputField.Label = Field.Label;
InputField.LeftIcon = Field.LeftIcon;
InputField.RightIcon = Field.RightIcon;
InputField.Content = Field.Content;
InputField.ContentValue = Field.ContentValue;
InputField.Description = Field.Description;
InputField.Error = Field.Error;

const _renderCloseIcon = (fill?: ColorValue) => <CloseIcon fill={fill} />;
