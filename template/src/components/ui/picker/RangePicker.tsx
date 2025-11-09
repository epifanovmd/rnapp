import { BottomSheetView } from "@gorhom/bottom-sheet";
import React, {
  JSX,
  memo,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Col, Row } from "../../flexView";
import {
  BottomSheet,
  TBottomSheetProps,
  useBottomSheetRef,
} from "../bottomSheet";
import { ITouchableProps, Touchable } from "../touchable";
import {
  Picker,
  PickerChangeItem,
  PickerColumn,
  PickerItem,
  PickerProps,
} from "./shared";

export interface RangePickerProps<T extends string | number>
  extends ITouchableProps {
  items: T[];
  range?: [T | undefined, T | undefined] | null;
  onChange?: (range: [T, T]) => void;
  emptyLabel?: [string, string];
  reverse?: boolean;

  pickerProps?: Omit<PickerProps, "onChange">;
  bottomSheetProps?: TBottomSheetProps;
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
  ): React.ReactNode;
}

const empty = -1;

export const RangePicker: RangePicker = memo(
  ({
    items: _items,
    range,
    onChange,
    emptyLabel = ["от", "до"],
    reverse = false,
    children,
    pickerProps,
    bottomSheetProps,
    containerProps,
    renderHeader,
    renderFooter,
    ...rest
  }: PropsWithChildren<RangePickerProps<any>>) => {
    const modalRef = useBottomSheetRef();

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
            (reverse ? item >= currentSecondItem : item <= currentSecondItem) ||
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
            (reverse ? item <= currentFirstItem : item >= currentFirstItem) ||
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

    const handleChange = useCallback(
      ({ value, column }: PickerChangeItem) => {
        const from = currentFirstItem === empty ? undefined : currentFirstItem;
        const to = currentSecondItem === empty ? undefined : currentSecondItem;

        if (column === 0) {
          setCurrentFirstItem(value);
        } else {
          setCurrentSecondItem(value);
        }

        if (onChange && !renderFooter) {
          onChange([from, to]);
        }
      },
      [currentFirstItem, currentSecondItem, onChange, renderFooter],
    );

    const onApply = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    const handleOpen = useCallback(() => {
      onUpdate();
      modalRef.current?.present();
    }, [modalRef, onUpdate]);

    const onClose = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <BottomSheet ref={modalRef} {...bottomSheetProps}>
          <BottomSheet.Content {...containerProps}>
            {renderHeader?.(onClose)}

            <Row pv={16} ph={8} justifyContent={"space-around"}>
              <Col flexGrow={1} flexBasis={0} pr={8}>
                <Picker onChange={handleChange} {...pickerProps}>
                  <PickerColumn selectedValue={currentFirstItem}>
                    {firstItems.map(item => {
                      return (
                        <PickerItem
                          key={item + "first"}
                          label={item === empty ? emptyLabel[0] : String(item)}
                          value={item}
                        />
                      );
                    })}
                  </PickerColumn>
                  <PickerColumn selectedValue={currentSecondItem}>
                    {secondItems.map(item => {
                      return (
                        <PickerItem
                          key={item + "second"}
                          label={item === empty ? emptyLabel[1] : String(item)}
                          value={item}
                        />
                      );
                    })}
                  </PickerColumn>
                </Picker>
              </Col>
            </Row>

            {renderFooter?.({ onReset, onApply })}
            <SafeAreaView edges={["bottom"]} />
          </BottomSheet.Content>
        </BottomSheet>
      </Touchable>
    );
  },
);
