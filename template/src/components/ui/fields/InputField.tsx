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
  TextInput,
  NativeSyntheticEvent,
  TextInputFocusEventData,
} from 'react-native';
import {
  createSlot,
  InputProps,
  mergeRefs,
  Modal,
  ModalHeaderProps,
  ModalProps,
  resolveStyleProp,
  useModal,
  useSlotProps,
  ModalHeader as _ModalHeader,
  SafeArea,
  Input,
  ScrollView,
  ScrollViewProps,
  TextProps,
} from '@force-dev/react-mobile';
import {CloseIcon} from '@force-dev/react-mobile/src/icons/material/Close';
import {Field, FieldProps, FieldSlots} from '../field';

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

    const {
      input,
      modal,
      modalScrollView,
      modalHeader,
      modalLabel,
      leftIcon,
      label,
      content,
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
      input?.onChangeText?.(modalValue);

      inputRef.current?.blur();
    }, [input, modal, modalValue]);

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
      () => [{backgroundColor: 'gray', minHeight: 250}, modal?.modalStyle],
      [modal?.modalStyle],
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
        )(fill ?? resolveStyleProp([modalLabel?.style]).color ?? '#fff'),
      [modal?.renderCloseIcon, modalHeader?.renderCloseIcon, modalLabel?.style],
    );

    const handleBlur = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        input?.onBlur?.(e);
        modalRef.current?.close();
      },
      [input, modalRef],
    );

    return (
      <>
        <Field {...rest} onPress={handlePress}>
          <Field.Label {...label} />
          <Field.LeftIcon {...leftIcon} />
          <Field.Content {...content}>
            <Input
              ref={mergedRef}
              {...input}
              pointerEvents={disabled || !!modal ? 'none' : undefined}
              disabled={disabled || !!modal}
            />
          </Field.Content>
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
            {...modal}
            modalStyle={modalStyle}
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
              pa={16}
              bounces={false}
              keyboardShouldPersistTaps={'handled'}
              {...modalScrollView}>
              <InputField ref={mergedRef} onPress={handlePress}>
                <InputField.Content {...content} />
                <InputField.Input
                  {...input}
                  onBlur={handleBlur}
                  value={modalValue}
                  onChangeText={setModalValue}
                  autoFocus={true}
                />
              </InputField>

              {modal?.children}
            </ScrollView>
            <SafeArea bottom={true} />
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
InputField.Description = Field.Description;
InputField.Error = Field.Error;

const _renderCloseIcon = (fill?: ColorValue) => <CloseIcon fill={fill} />;
