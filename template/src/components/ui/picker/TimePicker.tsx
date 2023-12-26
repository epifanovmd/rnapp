import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {ViewProps} from 'react-native';
import {
  Col,
  Modal,
  ModalProps,
  Picker,
  PickerChangeItem,
  PickerColumn,
  PickerItem,
  PickerProps,
  Row,
  SafeArea,
  Touchable,
  TouchableProps,
  useModal,
} from '@force-dev/react-mobile';
import {Button, ButtonProps} from '../button';

export interface TimePickerProps extends TouchableProps {
  time?: string;
  onChange?: (time: string) => void;

  pickerProps?: PickerProps;

  modalProps?: ModalProps;
  containerProps?: ViewProps;

  actionsContainerProps?: ViewProps;
  resetButtonProps?: ButtonProps;
  acceptButtonProps?: ButtonProps;
}

const toTwoChars = (string: string) => {
  if (string.length === 1) {
    return `0${string}`;
  }

  return string;
};

const hours = new Array(24)
  .fill(0)
  .map((_item, index) => toTwoChars(`${index}`));
const minutes = new Array(60)
  .fill(0)
  .map((_item, index) => toTwoChars(`${index}`));

export const TimePicker: FC<PropsWithChildren<TimePickerProps>> = memo(
  ({
    time,
    onChange,
    children,
    pickerProps,
    modalProps,
    containerProps,
    actionsContainerProps,
    resetButtonProps,
    acceptButtonProps,
    ...rest
  }) => {
    const {ref: modalRef} = useModal();

    const [hour, minute] = useMemo(() => {
      const _time = new Date().toTimeString().split(':');

      return time ? time.split(':') : [_time[0], _time[1]];
    }, [time]);

    const [currentFirstItem, setCurrentFirstItem] = useState<string>(hour);

    const [currentSecondItem, setCurrentSecondItem] = useState<string>(minute);

    const reset = useCallback(() => {
      const _time = new Date().toTimeString().split(':');
      const [_hour, _minute] = time ? time.split(':') : [_time[0], _time[1]];

      setCurrentFirstItem(_hour);
      setCurrentSecondItem(_minute);
    }, [time]);

    useEffect(() => {
      reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [time]);

    const handleApply = useCallback(() => {
      if (onChange) {
        onChange(`${currentFirstItem}:${currentSecondItem}`);
      }
      modalRef.current?.close();
    }, [currentFirstItem, currentSecondItem, modalRef, onChange]);

    const handleOpen = useCallback(() => {
      reset();
      modalRef.current?.open();
    }, [modalRef, reset]);

    const handleFirst = useCallback(({value}: PickerChangeItem) => {
      setCurrentFirstItem(value as string);
    }, []);

    const handleSecond = useCallback(({value}: PickerChangeItem) => {
      setCurrentSecondItem(value as string);
    }, []);

    const renderFirstItems = useMemo(
      () =>
        hours.map(item => {
          return (
            <PickerItem
              key={item + 'first'}
              label={String(item)}
              value={item}
            />
          );
        }),
      [],
    );

    const renderSecondItems = useMemo(
      () =>
        minutes.map(item => {
          return (
            <PickerItem
              key={item + 'second'}
              label={String(item)}
              value={item}
            />
          );
        }),
      [],
    );

    const first = useMemo(
      () => (
        <PickerColumn selectedValue={currentFirstItem} onChange={handleFirst}>
          {renderFirstItems}
        </PickerColumn>
      ),
      [currentFirstItem, handleFirst, renderFirstItems],
    );

    const second = useMemo(
      () => (
        <PickerColumn selectedValue={currentSecondItem} onChange={handleSecond}>
          {renderSecondItems}
        </PickerColumn>
      ),
      [currentSecondItem, handleSecond, renderSecondItems],
    );

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <Modal
          ref={modalRef}
          adjustToContentHeight={true}
          childrenPanGestureEnabled={false}
          {...modalProps}>
          <Col pa={16} {...containerProps}>
            <Row justifyContent={'space-around'}>
              <Col flexGrow={1} flexBasis={0} pr={8}>
                <Picker {...pickerProps}>{first}</Picker>
              </Col>
              <Col flexGrow={1} flexBasis={0} pl={8}>
                <Picker {...pickerProps}>{second}</Picker>
              </Col>
            </Row>

            <Row
              pt={16}
              justifyContent={'space-between'}
              {...actionsContainerProps}>
              <Button
                title={'Сбросить'}
                {...resetButtonProps}
                onPress={reset}
              />
              <Button
                title={'Применить'}
                {...acceptButtonProps}
                onPress={handleApply}
              />
            </Row>

            <SafeArea bottom />
          </Col>
        </Modal>
      </Touchable>
    );
  },
);
