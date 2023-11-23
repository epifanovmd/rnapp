import React, {
  FC,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Col, Row} from '../../elements';
import {Button, IButtonProps} from '../button';
import {Picker, PickerProps} from './Picker';
import {SafeAreaBottom} from '../safeArea';
import {Touchable, TouchableProps} from '../touchable';
import {Modal, useModal} from '../modal';
import {StyleSheet, ViewProps, ViewStyle} from 'react-native';
import {IModalProps} from '../modal/types';

export interface TimePickerProps extends TouchableProps<any> {
  time?: string;
  onChange?: (time: string) => void;
  renderItem: (item: string, active: boolean, index: number) => JSX.Element;

  pickerProps?: Omit<
    PickerProps<string>,
    'index' | 'items' | 'renderItem' | 'onIndexChange' | 'lineStyle'
  >;

  leftPickerLineStyle?: ViewStyle;
  rightPickerLineStyle?: ViewStyle;

  modalProps?: IModalProps;
  containerProps?: ViewProps;

  actionsContainerProps?: ViewProps;
  resetButtonProps?: IButtonProps;
  acceptButtonProps?: IButtonProps;
}

const hours = new Array(24).fill(0).map((_item, index) => `${index}`);
const minutes = new Array(60).fill(0).map((_item, index) => `${index}`);

const getHourIndex = (hour?: string) => {
  const index = hours.findIndex(item => item === hour);

  return index === -1 ? 0 : index;
};

const getMinuteIndex = (minute?: string) => {
  const index = minutes.findIndex(item => item === minute);

  return index === -1 ? 0 : index;
};

export const TimePicker: FC<PropsWithChildren<TimePickerProps>> = memo(
  ({
    time,
    onChange,
    renderItem,
    children,
    pickerProps,
    leftPickerLineStyle,
    rightPickerLineStyle,
    modalProps,
    containerProps,
    actionsContainerProps,
    resetButtonProps,
    acceptButtonProps,
    ...rest
  }) => {
    const {ref: modalRef} = useModal();

    const [hour, minute] = useMemo(() => {
      return time?.split(':') || [undefined, undefined];
    }, [time]);

    const [currentFirstIndex, setCurrentFirstIndex] = useState<number>(
      getHourIndex(hour),
    );

    const [currentSecondIndex, setCurrentSecondIndex] = useState<number>(
      getMinuteIndex(minute),
    );

    const reset = useCallback(() => {
      setCurrentFirstIndex(getHourIndex(hour));
      setCurrentSecondIndex(getMinuteIndex(minute));
    }, [hour, minute]);

    useEffect(() => {
      reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [time]);

    const handleApply = useCallback(() => {
      if (onChange) {
        onChange(`${hours[currentFirstIndex]}:${minutes[currentSecondIndex]}`);
      }
      modalRef.current?.close();
    }, [currentFirstIndex, currentSecondIndex, modalRef, onChange]);

    const handleOpen = useCallback(() => {
      reset();
      modalRef.current?.open();
    }, [modalRef, reset]);

    const handleFirst = useCallback((item: any, index: number) => {
      setCurrentFirstIndex(index);
    }, []);

    const handleSecond = useCallback((item: any, index: number) => {
      setCurrentSecondIndex(index);
    }, []);

    const _leftPickerLineStyle = useMemo(
      () => ({
        ...s.leftLineStyle,
        ...leftPickerLineStyle,
      }),
      [leftPickerLineStyle],
    );
    const _rightPickerLineStyle = useMemo(
      () => ({
        ...s.rightLineStyle,
        ...rightPickerLineStyle,
      }),
      [rightPickerLineStyle],
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
            <Row>
              <Picker
                style={s.pickerStyle}
                lineStyle={_leftPickerLineStyle}
                itemHeight={27}
                {...pickerProps}
                index={currentFirstIndex}
                items={hours}
                renderItem={renderItem}
                onIndexChange={handleFirst}
              />
              <Picker
                style={s.pickerStyle}
                lineStyle={_rightPickerLineStyle}
                itemHeight={27}
                {...pickerProps}
                index={currentSecondIndex}
                items={minutes}
                renderItem={renderItem}
                onIndexChange={handleSecond}
              />
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

            <SafeAreaBottom />
          </Col>
        </Modal>
      </Touchable>
    );
  },
);

const s = StyleSheet.create({
  leftLineStyle: {
    borderBottomLeftRadius: 10,
    borderTopLeftRadius: 10,
    marginLeft: 10,
    paddingRight: 10,
  },

  rightLineStyle: {
    borderBottomRightRadius: 10,
    borderTopRightRadius: 10,
    marginRight: 10,
    paddingLeft: 10,
  },
  pickerStyle: {flex: 1},
});