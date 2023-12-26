import React, {
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import {ViewProps} from 'react-native';
import {Button, ButtonProps} from '../button';

export interface RangePickerProps<T extends string | number>
  extends TouchableProps {
  items: T[];
  range?: [T | undefined, T | undefined] | null;
  onChange?: (range: [T, T]) => void;
  emptyLabel?: [string, string];
  reverse?: boolean;

  pickerProps?: Omit<PickerProps, 'onChange'>;

  modalProps?: ModalProps;
  containerProps?: ViewProps;

  actionsContainerProps?: ViewProps;
  resetButtonProps?: ButtonProps;
  acceptButtonProps?: ButtonProps;
}

interface RangePicker {
  <T extends string | number>(
    props: PropsWithChildren<RangePickerProps<T>>,
  ): React.JSX.Element | null;
}

const empty = 'empty picker item';

export const RangePicker: RangePicker = memo(
  ({
    items: _items,
    range,
    onChange,
    emptyLabel = ['от', 'до'],
    reverse = false,
    children,
    pickerProps,
    modalProps,
    containerProps,
    actionsContainerProps,
    resetButtonProps,
    acceptButtonProps,
    ...rest
  }: PropsWithChildren<RangePickerProps<any>>) => {
    const {ref: modalRef} = useModal();

    const items = useMemo(
      () => [empty, ...(reverse ? [..._items].reverse() : _items)],
      [reverse, _items],
    );

    const [currentFirstItem, setCurrentFirstItem] = useState<
      string | number | undefined
    >(range?.[0]);

    const [currentSecondItem, setCurrentSecondItem] = useState<
      string | number | undefined
    >(range?.[1]);

    const firstItems = useMemo(() => {
      if (currentSecondItem === empty || currentSecondItem === undefined) {
        return items;
      } else {
        return items.filter(
          (item, index) =>
            (reverse ? item <= currentSecondItem : item >= currentSecondItem) ||
            index === 0,
        );
      }
    }, [currentSecondItem, items, reverse]);

    const secondItems = useMemo(() => {
      if (currentFirstItem === empty || currentFirstItem === undefined) {
        return items;
      } else {
        return items.filter(
          (item, index) =>
            (reverse ? item >= currentFirstItem : item <= currentFirstItem) ||
            index === 0,
        );
      }
    }, [currentFirstItem, items, reverse]);

    const reset = useCallback(() => {
      setCurrentFirstItem(range?.[0]);
      setCurrentSecondItem(range?.[1]);
    }, [range]);

    useEffect(() => {
      reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [range]);

    const handleApply = useCallback(() => {
      const value: [any, any] = [currentFirstItem, currentSecondItem];

      if (onChange) {
        onChange(value);
      }
      modalRef.current?.close();
    }, [currentFirstItem, currentSecondItem, modalRef, onChange]);

    const handleOpen = useCallback(() => {
      reset();
      modalRef.current?.open();
    }, [modalRef, reset]);

    const handleFirst = useCallback(({value}: PickerChangeItem) => {
      if (value !== undefined) {
        setCurrentFirstItem(value);
      }
    }, []);

    const handleSecond = useCallback(({value}: PickerChangeItem) => {
      if (value !== undefined) {
        setCurrentSecondItem(value);
      }
    }, []);

    const renderFirstItems = useMemo(
      () =>
        firstItems.map(item => {
          return (
            <PickerItem
              key={item + 'first'}
              label={item === empty ? emptyLabel[0] : String(item)}
              value={item}
            />
          );
        }),
      [emptyLabel, firstItems],
    );

    const renderSecondItems = useMemo(
      () =>
        secondItems.map(item => {
          return (
            <PickerItem
              key={item + 'second'}
              label={item === empty ? emptyLabel[1] : String(item)}
              value={item}
            />
          );
        }),
      [emptyLabel, secondItems],
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

            <SafeArea bottom={true} />
          </Col>
        </Modal>
      </Touchable>
    );
  },
);
