import React, {FC, memo, PropsWithChildren, useCallback, useState} from 'react';
import {ModalField, ModalFieldProps, ModalFieldSlots} from './ModalField';
import {
  createSlot,
  Input,
  InputProps,
  RenderConditional,
  useModal,
  useSlotProps,
} from '@force-dev/react-mobile';
import {Text} from '../text';
import {Field, FieldSlots} from '../field';
import {StyleSheet} from 'react-native';

export interface InputRangeFieldProps extends ModalFieldProps {
  title?: string;
  onChange?: (from?: number, to?: number) => void;
  from?: number;
  to?: number;
}

const InputFrom = createSlot<InputProps>('InputFrom');
const InputTo = createSlot<InputProps>('InputTo');

export interface InputRangeFieldSlots extends ModalFieldSlots, FieldSlots {
  InputFrom: typeof InputFrom;
  InputTo: typeof InputTo;
}

const _InputRangeField: FC<PropsWithChildren<InputRangeFieldProps>> = memo(
  ({title, from, to, onChange, children, ...rest}) => {
    const {ref: modalRef} = useModal();
    const [valueFrom, setValueFrom] = useState(String(from || ''));
    const [valueTo, setValueTo] = useState(String(to || ''));

    const {
      inputFrom,
      inputTo,
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
    } = useSlotProps(InputRangeField, children);

    const onReset = useCallback(() => {
      setValueFrom('');
      setValueTo('');
    }, []);

    const onApply = useCallback(() => {
      const f = valueFrom === '' ? undefined : Number(valueFrom);
      const t = valueTo === '' ? undefined : Number(valueTo);
      onChange?.(f, t);
      modalRef.current?.close();
    }, [modalRef, onChange, valueFrom, valueTo]);

    const price = `${from ? `от ${from} ` : ''}${to ? `до ${to}` : ''}`;

    return (
      <ModalField ref={modalRef} {...rest}>
        <ModalField.Label text={title} {...label} />
        <ModalField.LeftIcon {...leftIcon} />
        <ModalField.Content {...content}>
          {content?.children ?? (
            <RenderConditional if={price}>
              <Text color={'#fff'}>{price}</Text>
            </RenderConditional>
          )}
        </ModalField.Content>
        <ModalField.ContentValue {...contentValue} />
        <ModalField.RightIcon {...rightIcon} />
        <ModalField.Error color={'red'} {...error} />
        <ModalField.Description {...description} />

        <ModalField.ModalHeader color={'black'} {...modalHeader} />
        <ModalField.ModalScrollView {...modalScrollView} />

        <ModalField.Modal {...modal}>
          <Input
            type={'number'}
            autoFocus={true}
            placeholder={'от'}
            containerStyle={s.inputFrom}
            inputTextColor={'#000'}
            placeholderTextColor={'#00000050'}
            {...inputFrom}
            value={valueFrom}
            onChangeText={setValueFrom}
          />
          <Input
            type={'number'}
            placeholder={'до'}
            containerStyle={s.inputTo}
            inputTextColor={'#000'}
            placeholderTextColor={'#00000050'}
            {...inputTo}
            value={valueTo}
            onChangeText={setValueTo}
          />
        </ModalField.Modal>

        <ModalField.ModalFooter
          rejectTitle={'Сбросить'}
          acceptTitle={'Готово'}
          mt={32}
          onReject={onReset}
          onAccept={onApply}
          {...modalFooter}
        />
      </ModalField>
    );
  },
);

export const InputRangeField = _InputRangeField as typeof _InputRangeField &
  InputRangeFieldSlots;

InputRangeField.InputFrom = InputFrom;
InputRangeField.InputTo = InputTo;

InputRangeField.Modal = ModalField.Modal;
InputRangeField.ModalScrollView = ModalField.ModalScrollView;
InputRangeField.ModalHeader = ModalField.ModalHeader;

InputRangeField.Label = Field.Label;
InputRangeField.LeftIcon = Field.LeftIcon;
InputRangeField.RightIcon = Field.RightIcon;
InputRangeField.Content = Field.Content;
InputRangeField.ContentValue = Field.ContentValue;
InputRangeField.Description = Field.Description;
InputRangeField.Error = Field.Error;

const s = StyleSheet.create({
  inputFrom: {borderBottomWidth: 1, borderColor: 'red'},
  inputTo: {borderBottomWidth: 1, borderColor: 'red'},
});
