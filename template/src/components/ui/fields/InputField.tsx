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
} from 'react';
import {
  ColorValue,
  GestureResponderEvent,
  NativeSyntheticEvent,
  StyleSheet,
  TextInput,
  TextInputFocusEventData,
} from 'react-native';
import {
  createSlot,
  Input,
  InputProps,
  mergeRefs,
  Modal,
  ModalHeader as _ModalHeader,
  ModalHeaderProps,
  ModalProps,
  useModal,
  useSlotProps,
} from '@force-dev/react-mobile';
import {useModalStyles} from '../../../common';
import {CloseIcon} from '../../icons';
import {Field, FieldProps, FieldSlots} from '../field';
import {ScrollView, ScrollViewProps} from '../scrollView';
import {Text, TextProps} from '../text';
import {ModalActions} from '../../modalActions';

interface InputFieldProps extends FieldProps {}

type ModalPropsWithRenderClose = ModalProps & {
  renderCloseIcon?: (fill?: ColorValue) => React.JSX.Element;
};

const InputSlot = createSlot<InputProps>('Input');
const ModalSlot = createSlot<ModalPropsWithRenderClose>('Modal');
const ModalScrollView = createSlot<ScrollViewProps>('ModalScrollView');
const ModalHeader = createSlot<ModalHeaderProps>('ModalHeader');
const ModalLabel = createSlot<TextProps>('ModalLabel');

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
  forwardRef(({children, onPress, ...rest}, ref) => {
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setFocused] = useState(false);
    const modalStyles = useModalStyles();

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

    const {ref: modalRef} = useModal();

    const openModal = useCallback(() => {
      modalRef.current?.open();
    }, [modalRef]);

    const handlePress = useCallback(
      (e: GestureResponderEvent, value: any) => {
        setFocused(true);
        inputRef.current?.focus();
        openModal();
        setModalValue(input?.value || '');
        onPress?.(e, value);
      },
      [input?.value, onPress, openModal],
    );

    const [modalValue, setModalValue] = useState<string>(input?.value || '');

    const onClose = useCallback(() => {
      modal?.onClose?.();

      inputRef.current?.blur();
    }, [modal]);

    const onClosed = useCallback(() => {
      modal?.onClosed?.();
      setModalValue('');
    }, [modal]);

    const onRequestClose = useCallback(() => {
      modalHeader?.onClose?.();
      modalRef.current?.close();
    }, [modalHeader, modalRef]);

    const mergedRef = useMemo(() => mergeRefs([ref, inputRef]), [ref]);
    const disabled = rest.disabled || input?.disabled;

    const modalStyle = useMemo(
      () => [{minHeight: 250}, modalStyles.modalStyle, modal?.modalStyle],
      [modal?.modalStyle, modalStyles.modalStyle],
    );

    const modalLabelStyle = useMemo(
      () => [{fontSize: 18, color: '#fff'}, modalLabel?.style],
      [modalLabel?.style],
    );

    const closeIcon = useCallback(
      (fill?: ColorValue) =>
        (
          modalHeader?.renderCloseIcon ??
          modal?.renderCloseIcon ??
          _renderCloseIcon
        )(fill ?? StyleSheet.flatten(modalLabel?.style).color ?? '#fff'),
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
        modalRef.current?.close();
      },
      [input, modalRef],
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
                    pointerEvents={disabled || !!modal ? 'none' : undefined}
                    disabled={disabled || !!modal}
                    containerStyle={{
                      width: '100%',
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
          <Field.Error color={'red'} {...error} />
          <Field.Description {...description} />
        </Field>
        {!!modal && (
          <Modal
            ref={modalRef}
            panGestureEnabled={false}
            adjustToContentHeight={true}
            withHandle={false}
            {...modalStyles}
            modalStyle={modalStyle}
            {...modal}
            onClose={onClose}
            onClosed={onClosed}>
            <_ModalHeader
              {...modalHeader}
              label={modalHeader?.label || label?.text}
              textStyle={[modalLabelStyle, modalHeader?.textStyle]}
              renderCloseIcon={closeIcon}
              onClose={onRequestClose}>
              {modalHeader?.children}
            </_ModalHeader>
            <ScrollView
              ph={16}
              minHeight={150}
              bounces={false}
              keyboardShouldPersistTaps={'handled'}
              {...modalScrollView}>
              <Field onPress={handlePress}>
                <Field.Content {...content}>
                  <Input
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
