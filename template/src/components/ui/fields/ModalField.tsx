import React, {
  FC,
  forwardRef,
  memo,
  PropsWithChildren,
  RefAttributes,
  useCallback,
  useMemo,
} from 'react';
import {ColorValue, GestureResponderEvent} from 'react-native';
import {
  createSlot,
  mergeRefs,
  Modal,
  ModalHeader as _ModalHeader,
  ModalHeaderProps,
  ModalProps,
  resolveStyleProp,
  SafeArea,
  ScrollView,
  ScrollViewProps,
  TextProps,
  useModal,
  useSlotProps,
} from '@force-dev/react-mobile';
import {CloseIcon} from '@force-dev/react-mobile/src/icons/material/Close';
import {Field, FieldProps, FieldSlots} from '../field';

interface ModalFieldProps extends FieldProps {}

type ModalPropsWithRenderClose = ModalProps & {
  renderCloseIcon?: (fill?: ColorValue) => React.JSX.Element;
};

const ModalSlot = createSlot<ModalPropsWithRenderClose>('Modal');
const ModalScrollView = createSlot<ScrollViewProps>('ModalScrollView');
const ModalHeader = createSlot<ModalHeaderProps>('ModalHeader');
const ModalLabel = createSlot<TextProps>('ModalLabel');

export interface ModalFieldSlots extends FieldSlots {
  Modal: typeof ModalSlot;
  ModalScrollView: typeof ModalScrollView;
  ModalHeader: typeof ModalHeader;
  ModalLabel: typeof ModalLabel;
}

const _ModalField: FC<
  PropsWithChildren<ModalFieldProps & RefAttributes<Modal>>
> = memo(
  forwardRef(({children, onPress, ...rest}, ref) => {
    const {
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
    } = useSlotProps(ModalField, children);

    console.log('ModalField RENDER');

    const {ref: modalRef} = useModal();

    const openModal = useCallback(() => {
      modalRef.current?.open();
    }, [modalRef]);

    const handlePress = useCallback(
      (e: GestureResponderEvent, value: any) => {
        openModal();
        onPress?.(e, value);
      },
      [onPress, openModal],
    );

    const onRequestClose = useCallback(() => {
      modalHeader?.onClose?.();
      modalRef.current?.close();
    }, [modalHeader, modalRef]);

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

    return (
      <>
        <Field {...rest} onPress={handlePress}>
          <Field.Label {...label} />
          <Field.LeftIcon {...leftIcon} />
          <Field.Content {...content} />
          <Field.RightIcon {...rightIcon} />
          <Field.Error color={'red'} {...error} />
          <Field.Description {...description} />
        </Field>
        <Modal
          ref={mergeRefs([modalRef, ref])}
          panGestureEnabled={false}
          adjustToContentHeight={true}
          withHandle={false}
          {...modal}
          modalStyle={modalStyle}>
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
            {modal?.children}
          </ScrollView>
          <SafeArea bottom={true} />
        </Modal>
      </>
    );
  }),
);

export const ModalField = _ModalField as typeof _ModalField & ModalFieldSlots;

ModalField.Modal = ModalSlot;
ModalField.ModalScrollView = ModalScrollView;
ModalField.ModalHeader = ModalHeader;
ModalField.ModalLabel = ModalLabel;

ModalField.Label = Field.Label;
ModalField.LeftIcon = Field.LeftIcon;
ModalField.RightIcon = Field.RightIcon;
ModalField.Content = Field.Content;
ModalField.Description = Field.Description;
ModalField.Error = Field.Error;

const _renderCloseIcon = (fill?: ColorValue) => <CloseIcon fill={fill} />;
