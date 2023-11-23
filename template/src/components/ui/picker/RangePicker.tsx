import React, {
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

export interface RangePickerProps<T extends Object & {index: number}>
  extends TouchableProps<any> {
  items: T[];
  range?: [T & {index: number}, T & {index: number}] | null;
  onChange?: (range: [T, T]) => void;
  renderItem: (item: T, active: boolean, index: number) => JSX.Element;

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

interface RangePicker {
  <T extends Object & {index: number}>(
    props: PropsWithChildren<RangePickerProps<T>>,
  ): JSX.Element | null;
}

export const RangePicker: RangePicker = memo(
  ({
    items,
    range,
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
  }: PropsWithChildren<RangePickerProps<any>>) => {
    const {ref: modalRef} = useModal();

    const [currentFirstIndex, setCurrentFirstIndex] = useState<number>(
      range?.[0].index ?? 0,
    );

    const firstItems = useMemo(() => items, [items]);

    const [currentSecondIndex, setCurrentSecondIndex] = useState<number>(
      range?.[1].index ?? 0,
    );

    const secondItems = useMemo(() => {
      const newItems = items.slice(currentFirstIndex, items.length);

      setCurrentSecondIndex(secondIndex =>
        secondIndex - currentFirstIndex < 0
          ? 0
          : secondIndex - currentFirstIndex,
      );

      return newItems;
    }, [items, currentFirstIndex]);

    const reset = useCallback(() => {
      const firstIndex = range?.[0].index ?? 0;
      const secondIndex = range?.[1].index ?? 0;
      setCurrentFirstIndex(firstIndex);
      setCurrentSecondIndex(secondIndex - firstIndex);
    }, [range]);

    useEffect(() => {
      reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const handleApply = useCallback(() => {
      const value: [any, any] = [
        firstItems[currentFirstIndex],
        secondItems[currentSecondIndex],
      ];
      if (onChange) {
        onChange(value);
      }
      modalRef.current?.close();
    }, [
      currentFirstIndex,
      currentSecondIndex,
      firstItems,
      modalRef,
      onChange,
      secondItems,
    ]);

    const handleOpen = useCallback(() => {
      reset();
      modalRef.current?.open();
    }, [modalRef, reset]);

    const handleFirst = useCallback(
      (item: any, index: number) => {
        const secondIndex = range?.[1].index ?? 0;
        setCurrentFirstIndex(index);
        setCurrentSecondIndex(
          secondIndex - index < 0 ? 0 : secondIndex - index,
        );
      },
      [range],
    );

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
                items={firstItems}
                renderItem={renderItem}
                onIndexChange={handleFirst}
              />
              <Picker
                style={s.pickerStyle}
                lineStyle={_rightPickerLineStyle}
                itemHeight={27}
                {...pickerProps}
                index={currentSecondIndex}
                items={secondItems}
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
