import React, {
  JSX,
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
  useModal,
} from '@force-dev/react-mobile';
import {ViewProps} from 'react-native';
import {useModalStyles} from '../../../common';
import {Touchable, TouchableProps} from '../touchable';

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

  renderHeader?: (onClose: () => void) => JSX.Element | null;
  renderFooter?: (params: {
    onReset: () => void;
    onApply: () => void;
  }) => JSX.Element | null;
}

interface RangePicker {
  <T extends string | number>(
    props: PropsWithChildren<RangePickerProps<T>>,
  ): React.JSX.Element | null;
}

const empty = -1;

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
    renderHeader,
    renderFooter,
    ...rest
  }: PropsWithChildren<RangePickerProps<any>>) => {
    const {ref: modalRef} = useModal();
    const modalStyles = useModalStyles();

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

    const onReset = useCallback(() => {
      setCurrentFirstItem(items[0]);
      setCurrentSecondItem(items[0]);
    }, [items]);

    const onUpdate = useCallback(() => {
      setCurrentFirstItem(range?.[0]);
      setCurrentSecondItem(range?.[1]);
    }, [range]);

    useEffect(() => {
      onUpdate();
    }, [onUpdate]);

    const handleChange = useCallback(() => {
      const from = currentFirstItem === empty ? undefined : currentFirstItem;
      const to = currentSecondItem === empty ? undefined : currentSecondItem;
      if (onChange) {
        onChange([from, to]);
      }
    }, [currentFirstItem, currentSecondItem, onChange]);

    const onApply = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    const handleOpen = useCallback(() => {
      onUpdate();
      modalRef.current?.open();
    }, [modalRef, onUpdate]);

    const handleFirst = useCallback(
      ({value}: PickerChangeItem) => {
        if (value !== undefined) {
          if (!renderFooter) {
            handleChange();
          }
          setCurrentFirstItem(value);
        }
      },
      [handleChange, renderFooter],
    );

    const handleSecond = useCallback(
      ({value}: PickerChangeItem) => {
        if (value !== undefined) {
          if (!renderFooter) {
            handleChange();
          }
          setCurrentSecondItem(value);
        }
      },
      [handleChange, renderFooter],
    );

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

    const onClose = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <Modal
          ref={modalRef}
          handlePosition={'inside'}
          adjustToContentHeight={true}
          childrenPanGestureEnabled={false}
          onClose={handleChange}
          {...modalStyles}
          {...modalProps}>
          <Col {...containerProps}>
            {renderHeader?.(onClose)}

            <Row pv={16} ph={8} justifyContent={'space-around'}>
              <Col flexGrow={1} flexBasis={0} pr={8}>
                <Picker {...pickerProps}>{first}</Picker>
              </Col>
              <Col flexGrow={1} flexBasis={0} pl={8}>
                <Picker {...pickerProps}>{second}</Picker>
              </Col>
            </Row>

            {renderFooter?.({onReset, onApply})}
            <SafeArea bottom={true} />
          </Col>
        </Modal>
      </Touchable>
    );
  },
);
