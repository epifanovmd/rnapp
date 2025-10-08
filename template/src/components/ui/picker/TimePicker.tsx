import { BottomSheetView } from "@gorhom/bottom-sheet";
import React, {
  FC,
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

export interface TimePickerProps extends ITouchableProps {
  time?: string;
  onChange?: (time: string) => void;

  pickerProps?: PickerProps;
  bottomSheetProps?: TBottomSheetProps;
  containerProps?: ViewProps;

  renderHeader?: (onClose: () => void) => JSX.Element | null;
  renderFooter?: (params: {
    onReset: () => void;
    onApply: () => void;
  }) => JSX.Element | null;
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
    bottomSheetProps,
    containerProps,
    renderHeader,
    renderFooter,
    ...rest
  }) => {
    const modalRef = useBottomSheetRef();

    const [hour, minute] = useMemo(() => {
      const _time = new Date().toTimeString().split(":");

      return time ? time.split(":") : [_time[0], _time[1]];
    }, [time]);

    const [currentFirstItem, setCurrentFirstItem] = useState<string>(hour);

    const [currentSecondItem, setCurrentSecondItem] = useState<string>(minute);

    const onReset = useCallback(() => {
      const _time = new Date().toTimeString().split(":");
      const [_hour, _minute] = time ? time.split(":") : [_time[0], _time[1]];

      setCurrentFirstItem(_hour);
      setCurrentSecondItem(_minute);
    }, [time]);

    useEffect(() => {
      onReset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [time]);

    const onApply = useCallback(() => {
      if (onChange) {
        onChange(`${currentFirstItem}:${currentSecondItem}`);
      }
      modalRef.current?.close();
    }, [currentFirstItem, currentSecondItem, modalRef, onChange]);

    const handleOpen = useCallback(() => {
      onReset();
      modalRef.current?.present();
    }, [modalRef, onReset]);

    const handleFirst = useCallback(
      ({ value }: PickerChangeItem) => {
        if (onChange && !renderHeader) {
          onChange(`${value}:${currentSecondItem}`);
        }
        setCurrentFirstItem(value as string);
      },
      [currentSecondItem, onChange, renderHeader],
    );

    const handleSecond = useCallback(
      ({ value }: PickerChangeItem) => {
        if (onChange && !renderHeader) {
          onChange(`${currentFirstItem}:${value}`);
        }
        setCurrentSecondItem(value as string);
      },
      [currentFirstItem, onChange, renderHeader],
    );

    const renderFirstItems = useMemo(
      () =>
        hours.map(item => {
          return (
            <PickerItem
              key={item + "first"}
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
              key={item + "second"}
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

    const onClose = useCallback(() => {
      modalRef.current?.close();
    }, [modalRef]);

    return (
      <Touchable {...rest} onPress={handleOpen}>
        {children}

        <BottomSheet ref={modalRef} {...bottomSheetProps}>
          <BottomSheetView {...containerProps}>
            {renderHeader?.(onClose)}

            <Row pa={8} justifyContent={"space-around"}>
              <Col flexGrow={1} flexBasis={0} pr={8}>
                <Picker {...pickerProps}>{first}</Picker>
              </Col>
              <Col flexGrow={1} flexBasis={0} pl={8}>
                <Picker {...pickerProps}>{second}</Picker>
              </Col>
            </Row>

            {renderFooter?.({ onReset, onApply })}
            <SafeAreaView edges={["bottom"]} />
          </BottomSheetView>
        </BottomSheet>
      </Touchable>
    );
  },
);
