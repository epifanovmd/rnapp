import React, {memo, PropsWithChildren, useCallback} from 'react';
import {
  createSlot,
  ModalHeader,
  ModalHeaderProps,
  Select,
  useSlotProps,
} from '@force-dev/react-mobile';
import {useModalStyles} from '../../../common';
import {Field, FieldProps, FieldSlots} from '../field';
import {SelectProps} from '@force-dev/react-mobile/src/components/select/Select';
import {
  ModalActions,
  ModalActionsProps,
  ModalActionsSlots,
} from '../../modalActions';

export interface SelectFieldProps<D extends any, M extends boolean = false>
  extends Omit<
    SelectProps<D, M>,
    'renderItem' | 'data' | 'selected' | 'onChange'
  > {
  title?: string;
  selected?: M extends true ? D[] : D;
  onChange?: (item: M extends true ? D[] : D) => void;
  data: D[];
  multiply?: M;
  renderItem: (
    item: D,
    active: boolean,
    index: number,
  ) => React.JSX.Element | null;
}

const ModalActionsSlot =
  createSlot<Omit<ModalActionsProps, 'onReject' | 'onAccept'>>('ModalActions');
const ModalHeaderSlot =
  createSlot<Omit<ModalHeaderProps, 'onClose'>>('ModalHeader');

const FieldSlot = createSlot<FieldProps>('Field');

export interface SelectFieldSlots extends FieldSlots, ModalActionsSlots {
  ModalActions: typeof ModalActionsSlot;
  ModalHeader: typeof ModalHeaderSlot;

  Field: typeof FieldSlot;
}

const _SelectField = <D extends any, M extends boolean = false>({
  title,
  selected,
  onChange,
  data,
  multiply,
  renderItem,
  children,
  ...selectProps
}: PropsWithChildren<SelectFieldProps<D, M>>) => {
  const modalStyles = useModalStyles();

  const {
    modalHeader,
    modalActions,
    rejectButton,
    acceptButton,
    field,
    leftIcon,
    label,
    content,
    contentValue,
    rightIcon,
    description,
    error,
  } = useSlotProps(SelectField, children);

  const renderHeader = useCallback(
    (onClose: () => void) => {
      return (
        <ModalHeader
          color={'#000'}
          label={title}
          {...modalHeader}
          onClose={onClose}
        />
      );
    },
    [modalHeader, title],
  );

  const renderFooter = useCallback(
    ({onReset, onApply}: {onReset: () => void; onApply: () => void}) => {
      return (
        <ModalActions
          rejectTitle={'Сбросить'}
          {...modalActions}
          onReject={onReset}
          onAccept={onApply}>
          <ModalActions.RejectButton {...rejectButton} />
          <ModalActions.AcceptButton {...acceptButton} />
        </ModalActions>
      );
    },
    [acceptButton, modalActions, rejectButton],
  );

  return (
    <Select
      renderHeader={renderHeader}
      renderFooter={renderFooter}
      {...selectProps}
      multiply={multiply}
      renderItem={renderItem}
      data={data}
      selected={selected}
      modalProps={modalStyles}
      onChange={onChange}>
      <Field {...field}>
        <Field.Label text={title} {...label} />
        <Field.LeftIcon {...leftIcon} />
        <Field.Content {...content} />
        <Field.ContentValue {...contentValue} />
        <Field.RightIcon {...rightIcon} />
        <Field.Error color={'red'} {...error} />
        <Field.Description {...description} />
      </Field>
    </Select>
  );
};

export const SelectField = memo(_SelectField) as any as typeof _SelectField &
  SelectFieldSlots;

SelectField.ModalHeader = ModalHeaderSlot;
SelectField.ModalActions = ModalActionsSlot;

SelectField.RejectButton = ModalActions.RejectButton;
SelectField.AcceptButton = ModalActions.AcceptButton;

SelectField.Field = FieldSlot;
SelectField.Label = Field.Label;
SelectField.LeftIcon = Field.LeftIcon;
SelectField.RightIcon = Field.RightIcon;
SelectField.Content = Field.Content;
SelectField.ContentValue = Field.ContentValue;
SelectField.Description = Field.Description;
SelectField.Error = Field.Error;
